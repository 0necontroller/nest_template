import { verify as verifyPassword, hash } from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Profile } from 'passport-google-oauth20';
import { UserService } from '../user/user.service';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { RedisService } from '../common/redis/redis.service';
import { TwoFactorService } from './two-factor/two-factor.service';
import { NotificationService } from '../notification/notification.service';
import { uuidv7 } from 'uuidv7';
import { Response } from 'express';
import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { UserRole, UserStatus } from 'src/prisma/generated/prisma/enums';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private redisService: RedisService,
    private twoFactorService: TwoFactorService,
    private notificationService: NotificationService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const account = await this.prisma.account.findFirst({
      where: {
        provider: 'local',
        providerAccountId: email,
      },
    });

    if (!account || !account.passwordHash) {
      return null;
    }

    const isPasswordValid = await verifyPassword(account.passwordHash, password);
    if (!isPasswordValid) {
      return null;
    }

    const user = await this.userService.findOne(account.userId);
    return user;
  }

  async validateGoogleUser(profile: Profile): Promise<any> {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      throw new BadRequestException(
        'Google account must have an email address',
      );
    }

    const existingAccount = await this.prisma.account.findFirst({
      where: {
        provider: 'google',
        providerAccountId: profile.id,
      },
    });

    if (existingAccount) {
      return this.userService.findOne(existingAccount.userId);
    }

    const existingUser = await this.userService.findByEmail(email);
    if (existingUser) {
      await this.prisma.account.create({
        data: {
          userId: existingUser.id,
          type: 'oauth',
          provider: 'google',
          providerAccountId: profile.id,
        },
      });
      return existingUser;
    }

    const newUser = await this.prisma.user.create({
      data: {
        email,
        firstName: profile.name?.givenName || 'Google',
        lastName: profile.name?.familyName || 'User',
        role: UserRole.USER,
        country: 'US',
        isEmailVerified: true,
        status: UserStatus.PENDING_VERIFICATION,
        accounts: {
          create: {
            type: 'oauth',
            provider: 'google',
            providerAccountId: profile.id,
          },
        },
        notificationPreference: {
          create: {},
        },
      },
    });

    return newUser;
  }

  async validateMicrosoftUser(profile: any): Promise<any> {
    const email =
      profile.emails?.[0]?.value || profile.mail || profile.userPrincipalName;
    if (!email) {
      throw new BadRequestException(
        'Microsoft account must have an email address',
      );
    }

    const existingAccount = await this.prisma.account.findFirst({
      where: {
        provider: 'microsoft',
        providerAccountId: profile.id,
      },
    });

    if (existingAccount) {
      return this.userService.findOne(existingAccount.userId);
    }

    const existingUser = await this.userService.findByEmail(email);
    if (existingUser) {
      await this.prisma.account.create({
        data: {
          userId: existingUser.id,
          type: 'oauth',
          provider: 'microsoft',
          providerAccountId: profile.id,
        },
      });
      return existingUser;
    }

    const displayName = profile.displayName || 'Microsoft User';
    const parts = displayName.split(' ');
    const firstName = parts[0] || 'Microsoft';
    const lastName = parts.slice(1).join(' ') || 'User';

    const newUser = await this.prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        role: UserRole.USER,
        country: 'US',
        isEmailVerified: true,
        status: UserStatus.PENDING_VERIFICATION,
        accounts: {
          create: {
            type: 'oauth',
            provider: 'microsoft',
            providerAccountId: profile.id,
          },
        },
        notificationPreference: {
          create: {},
        },
      },
    });

    return newUser;
  }

  async login(
    user: any,
    ipAddress?: string,
    userAgent?: string,
    rememberMe?: boolean,
    isMfaVerified?: boolean,
  ): Promise<any> {
    if (user.isTwoFactorAuthenticationEnabled && !isMfaVerified) {
      const mfaToken = this.jwtService.sign(
        { sub: user.id, mfa_intent: true, rememberMe: !!rememberMe },
        {
          secret: this.configService.get<string>('jwt.secret'),
          expiresIn: 300,
        },
      );
      return {
        mfa_required: true,
        mfa_token: mfaToken,
        expires_in_seconds: 300,
      };
    }

    const accessTokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(accessTokenPayload);

    const refreshExpiresIn = rememberMe ? 2592000 : 900;
    const sessionId = uuidv7();

    const refreshToken = this.jwtService.sign(
      { sub: user.id, sessionId },
      {
        secret: this.configService.get<string>('refreshJwt.secret'),
        expiresIn: refreshExpiresIn,
      },
    );

    const userSessionsKey = `user-sessions:${user.id}`;
    const sessionsJson = await this.redisService.get(userSessionsKey);
    let activeSessions: string[] = sessionsJson ? JSON.parse(sessionsJson) : [];

    const validSessions: string[] = [];
    for (const id of activeSessions) {
      const exists = await this.redisService.get(`session:${id}`);
      if (exists) {
        validSessions.push(id);
      }
    }
    activeSessions = validSessions;

    if (activeSessions.length >= 5) {
      const oldestSessionId = activeSessions.shift();
      if (oldestSessionId) {
        await this.redisService.del(`session:${oldestSessionId}`);
      }
    }

    activeSessions.push(sessionId);
    await this.redisService.set(userSessionsKey, JSON.stringify(activeSessions), 2592000);

    const sessionData = {
      id: sessionId,
      userId: user.id,
      sessionToken: refreshToken,
      expires: new Date(Date.now() + refreshExpiresIn * 1000).toISOString(),
      userAgent: userAgent || 'unknown',
      ipAddress: ipAddress || 'unknown',
    };
    await this.redisService.set(`session:${sessionId}`, JSON.stringify(sessionData), refreshExpiresIn);

    return {
      accessToken,
      refreshToken,
      refreshExpiresIn,
      user,
    };
  }

  async verifyMfaCode(
    mfaToken: string,
    code: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    try {
      const payload = await this.jwtService.verifyAsync(mfaToken, {
        secret: this.configService.get<string>('jwt.secret'),
      });
      if (!payload.mfa_intent) {
        throw new UnauthorizedException('Invalid token purpose');
      }

      const user = await this.userService.findOne(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const account = await this.prisma.account.findFirst({
        where: { userId: user.id },
      });

      if (!account || !account.twoFactorAuthenticationSecret) {
        throw new UnauthorizedException('2FA setup is incomplete');
      }

      const isCodeValid = await this.twoFactorService.isTwoFactorAuthenticationCodeValid(
        code,
        account.twoFactorAuthenticationSecret,
      );

      if (!isCodeValid) {
        throw new UnauthorizedException('Wrong authentication code');
      }

      return this.login(user, ipAddress, userAgent, payload.rememberMe, true);
    } catch (e) {
      throw new UnauthorizedException(e.message || 'Verification failed');
    }
  }

  async generateMfaSecret(userId: string) {
    const user = await this.userService.findOne(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    const { secret, otpauthUrl } = this.twoFactorService.generateTwoFactorAuthenticationSecret(user.email);
    const qrCode = await this.twoFactorService.pipeQrCodeStream(otpauthUrl);

    const account = await this.prisma.account.findFirst({
      where: { userId },
    });
    if (account) {
      await this.prisma.account.update({
        where: { id: account.id },
        data: { twoFactorAuthenticationSecret: secret },
      });
    }

    return { secret, qrCode };
  }

  async confirmMfaSetup(userId: string, code: string) {
    const user = await this.userService.findOne(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    const account = await this.prisma.account.findFirst({
      where: { userId },
    });
    if (!account || !account.twoFactorAuthenticationSecret) {
      throw new BadRequestException('MFA not initiated');
    }

    const isCodeValid = await this.twoFactorService.isTwoFactorAuthenticationCodeValid(
      code,
      account.twoFactorAuthenticationSecret,
    );
    if (!isCodeValid) {
      throw new UnauthorizedException('Wrong authentication code');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { isTwoFactorAuthenticationEnabled: true },
    });

    return { success: true };
  }

  async disableMfa(userId: string, code: string) {
    const user = await this.userService.findOne(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    const account = await this.prisma.account.findFirst({
      where: { userId },
    });
    if (!account || !account.twoFactorAuthenticationSecret) {
      throw new BadRequestException('MFA not configured');
    }

    const isCodeValid = await this.twoFactorService.isTwoFactorAuthenticationCodeValid(
      code,
      account.twoFactorAuthenticationSecret,
    );
    if (!isCodeValid) {
      throw new UnauthorizedException('Wrong authentication code');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { isTwoFactorAuthenticationEnabled: false },
      }),
      this.prisma.account.update({
        where: { id: account.id },
        data: { twoFactorAuthenticationSecret: null },
      }),
    ]);

    return { success: true };
  }

  async register(
    registerDto: RegisterDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        email: registerDto.email,
      },
    });

    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    const hashedPassword = await hash(registerDto.password);

    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        role: registerDto.role as UserRole,
        country: registerDto.country,
        accounts: {
          create: {
            type: 'credentials',
            provider: 'local',
            providerAccountId: registerDto.email,
            passwordHash: hashedPassword,
          },
        },
        notificationPreference: {
          create: {},
        },
      },
    });

    await this.sendVerificationEmail(user.id);

    return this.login(user, ipAddress, userAgent, true);
  }

  async verifyEmail(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('jwt.secret'),
      });

      if (!payload.email_verification) {
        throw new UnauthorizedException('Invalid token purpose');
      }

      await this.prisma.user.update({
        where: { id: payload.sub },
        data: { isEmailVerified: true },
      });
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired email verification token');
    }
  }

  async sendVerificationEmail(userId: string) {
    const user = await this.userService.findOne(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    if (user.isEmailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    const verificationToken = this.jwtService.sign(
      { sub: user.id, email_verification: true },
      {
        secret: this.configService.get<string>('jwt.secret'),
        expiresIn: '24h',
      },
    );

    await this.notificationService.triggerNotification(
      user.id,
      user.email,
      'auth.verify-email',
      'Verify Your Account',
      'Please click the link below to verify your email address.',
      { token: verificationToken },
    );
  }

  async passwordResetRequest(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      const resetToken = this.jwtService.sign(
        { sub: user.id, password_reset: true },
        {
          secret: this.configService.get<string>('jwt.secret'),
          expiresIn: '1h',
        },
      );

      await this.notificationService.triggerNotification(
        user.id,
        user.email,
        'auth.password-reset',
        'Reset Your Password',
        'Please click the link below to reset your password.',
        { token: resetToken },
      );
    }
  }

  async passwordResetConfirm(token: string, password: string) {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('jwt.secret'),
      });

      if (!payload.password_reset) {
        throw new UnauthorizedException('Invalid token purpose');
      }

      const account = await this.prisma.account.findFirst({
        where: { userId: payload.sub, provider: 'local' },
      });

      if (!account) {
        throw new UnauthorizedException('Account not found');
      }

      const hashedPassword = await hash(password);

      await this.prisma.account.update({
        where: { id: account.id },
        data: { passwordHash: hashedPassword },
      });
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired password reset token');
    }
  }

  async refreshTokens(
    refreshToken: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('refreshJwt.secret'),
      });

      const sessionKey = `session:${payload.sessionId}`;
      const sessionJson = await this.redisService.get(sessionKey);

      if (!sessionJson) {
        throw new UnauthorizedException('Invalid or expired session');
      }

      const session = JSON.parse(sessionJson);
      if (
        session.sessionToken !== refreshToken ||
        new Date(session.expires) < new Date()
      ) {
        throw new UnauthorizedException('Invalid or expired session');
      }

      const user = await this.userService.findOne(session.userId);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      await this.redisService.del(sessionKey);

      const userSessionsKey = `user-sessions:${user.id}`;
      const sessionsJson = await this.redisService.get(userSessionsKey);
      if (sessionsJson) {
        const activeSessions: string[] = JSON.parse(sessionsJson);
        const filtered = activeSessions.filter((id) => id !== payload.sessionId);
        await this.redisService.set(userSessionsKey, JSON.stringify(filtered), 2592000);
      }

      return this.login(user, ipAddress, userAgent, true, true);
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async signout(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('refreshJwt.secret'),
        ignoreExpiration: true,
      });

      const sessionKey = `session:${payload.sessionId}`;
      await this.redisService.del(sessionKey);

      const userSessionsKey = `user-sessions:${payload.sub}`;
      const sessionsJson = await this.redisService.get(userSessionsKey);
      if (sessionsJson) {
        const activeSessions: string[] = JSON.parse(sessionsJson);
        const filtered = activeSessions.filter((id) => id !== payload.sessionId);
        await this.redisService.set(userSessionsKey, JSON.stringify(filtered), 2592000);
      }
    } catch (e) {
      // Ignore errors on signout
    }
  }

  async onboardProfile(userId: string, role: string, country: string) {
    if (role !== 'USER' && role !== 'ADMIN') {
      throw new BadRequestException('Invalid role for self-registration');
    }
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        role: role as UserRole,
        country,
      },
    });
  }

  async getMfaStatus(userId: string) {
    const user = await this.userService.findOne(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    return {
      mfaEnabled: user.isTwoFactorAuthenticationEnabled,
    };
  }

  async getMe(userId: string) {
    const user = await this.userService.findOne(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    const { accounts, ...rest } = user as any;
    return rest;
  }

  setRefreshCookie(res: Response, token: string, refreshExpiresIn: number) {
    res.cookie('refreshToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: refreshExpiresIn * 1000,
    });
  }

  setAccessCookie(res: Response, token: string) {
    const expires = this.configService.get<number>('jwt.expiresIn') ?? 3600;
    res.cookie('accessToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: expires * 1000,
    });
  }

  clearCookies(res: Response) {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
  }
}
