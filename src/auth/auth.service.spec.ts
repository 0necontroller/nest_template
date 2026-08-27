import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { verify } from 'argon2';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';
import { TwoFactorService } from './two-factor/two-factor.service';
import { NotificationService } from '../notification/notification.service';
import { UserRole, UserStatus } from 'src/prisma/generated/prisma/enums';

jest.mock('argon2', () => ({
  verify: jest.fn(),
  hash: jest.fn().mockResolvedValue('hashed-password'),
}));

jest.mock('otplib', () => ({
  generateSecret: jest.fn(),
  verify: jest.fn(),
  generateURI: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let userService: any;
  let prismaService: any;
  let jwtService: any;
  let configService: any;
  let redisService: any;
  let twoFactorService: any;
  let notificationService: any;

  const mockUser = {
    id: 'user-id-1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'USER',
    country: 'US',
    status: 'PENDING_VERIFICATION',
    isEmailVerified: false,
    isTwoFactorAuthenticationEnabled: false,
  };

  const mockAccount = {
    id: 'account-id-1',
    userId: 'user-id-1',
    type: 'credentials',
    provider: 'local',
    providerAccountId: 'test@example.com',
    passwordHash: 'hashed-password',
  };

  beforeEach(async () => {
    const mockUserService = {
      findOne: jest.fn(),
      findByEmail: jest.fn(),
      create: jest.fn(),
    };

    const mockPrismaService = {
      account: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      user: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn(),
      verifyAsync: jest.fn(),
      verify: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn(),
    };

    const mockRedisService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    const mockTwoFactorService = {
      isTwoFactorAuthenticationCodeValid: jest.fn(),
      generateTwoFactorAuthenticationSecret: jest.fn(),
      pipeQrCodeStream: jest.fn(),
    };

    const mockNotificationService = {
      triggerNotification: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: mockUserService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: RedisService, useValue: mockRedisService },
        { provide: TwoFactorService, useValue: mockTwoFactorService },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get(UserService);
    prismaService = module.get(PrismaService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
    redisService = module.get(RedisService);
    twoFactorService = module.get(TwoFactorService);
    notificationService = module.get(NotificationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('should return user when credentials are valid', async () => {
      prismaService.account.findFirst.mockResolvedValue(mockAccount as any);
      (verify as jest.Mock).mockResolvedValue(true);
      userService.findOne.mockResolvedValue(mockUser as any);

      const result = await service.validateUser(
        'test@example.com',
        'password123',
      );
      expect(result).toEqual(mockUser);
    });
  });

  describe('validateGoogleUser', () => {
    const mockGoogleProfile: any = {
      id: 'google-id-1',
      emails: [{ value: 'test@example.com' }],
      displayName: 'Google User',
      name: { givenName: 'Google', familyName: 'User' },
    };

    it('should return user if google account already exists', async () => {
      prismaService.account.findFirst.mockResolvedValue(mockAccount as any);
      userService.findOne.mockResolvedValue(mockUser as any);

      const result = await service.validateGoogleUser(mockGoogleProfile);
      expect(result).toEqual(mockUser);
    });

    it('should create new user and linked account if user does not exist', async () => {
      prismaService.account.findFirst.mockResolvedValue(null);
      userService.findByEmail.mockResolvedValue(null);
      prismaService.user.create.mockResolvedValue(mockUser as any);

      const result = await service.validateGoogleUser(mockGoogleProfile);
      expect(result).toEqual(mockUser);
      expect(prismaService.user.create).toHaveBeenCalled();
    });
  });

  describe('onboardProfile', () => {
    it('should update role and country for a user', async () => {
      prismaService.user.update.mockResolvedValue(mockUser as any);

      const result = await service.onboardProfile(
        'user-id-1',
        'ADMIN',
        'DE',
      );
      expect(result).toEqual(mockUser);
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-id-1' },
        data: { role: UserRole.ADMIN, country: 'DE' },
      });
    });

    it('should throw BadRequestException for invalid onboarding role', async () => {
      await expect(
        service.onboardProfile('user-id-1', 'SUPERADMIN', 'US'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getMfaStatus', () => {
    it('should return MFA status of user', async () => {
      userService.findOne.mockResolvedValue({
        isTwoFactorAuthenticationEnabled: true,
      });

      const result = await service.getMfaStatus('user-id-1');
      expect(result).toEqual({ mfaEnabled: true });
    });
  });

  describe('getMe', () => {
    it('should return user info without accounts', async () => {
      userService.findOne.mockResolvedValue({
        id: 'user-id-1',
        email: 'test@example.com',
        accounts: [{ id: 'acc1' }],
      });

      const result = await service.getMe('user-id-1');
      expect(result).toEqual({
        id: 'user-id-1',
        email: 'test@example.com',
      });
    });
  });
});
