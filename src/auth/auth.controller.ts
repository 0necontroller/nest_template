import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  Res,
  UnauthorizedException,
  Put,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { MicrosoftAuthGuard } from './guards/microsoft-auth.guard';
import {
  RegisterDto,
  LoginDto,
  VerifyMfaDto,
  ConfirmMfaDto,
  DisableMfaDto,
  PasswordResetRequestDto,
  PasswordResetConfirmDto,
  UserSuccessResponseDto,
  MfaSetupSuccessResponseDto,
  SuccessResponseEnvelopeDto,
  MessageResponseEnvelopeDto,
  OnboardingProfileDto,
  MfaStatusSuccessResponseDto,
} from './dto';
import { Public } from './decorators/public.decorator';
import { RequirePermissions } from './decorators/permissions.decorator';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Post('register')
  @ApiOperation({
    summary: 'User Registration',
    description: 'Registers a new user.',
  })
  @ApiResponse({ status: 201, type: UserSuccessResponseDto })
  async register(
    @Body() registerDto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];
    const result = await this.authService.register(
      registerDto,
      ipAddress,
      userAgent,
    );
    this.authService.setRefreshCookie(
      res,
      result.refreshToken,
      result.refreshExpiresIn,
    );
    this.authService.setAccessCookie(res, result.accessToken);
    const { accounts, ...user } = result.user;
    return {
      message: 'User registered successfully',
      ...user,
    };
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User Login',
    description:
      'Validates local credentials, sets secure HTTP-only cookies with custom TTL.',
  })
  @ApiResponse({
    status: 200,
    description: 'Success (User object or MFA intent token returned)',
    schema: {
      oneOf: [
        { $ref: '#/components/schemas/UserSuccessResponseDto' },
        { $ref: '#/components/schemas/MfaRequiredSuccessResponseDto' },
      ],
    },
  })
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];
    const result = await this.authService.login(
      req.user,
      ipAddress,
      userAgent,
      loginDto.rememberMe,
    );

    if ('mfa_required' in result) {
      return result;
    }

    this.authService.setRefreshCookie(
      res,
      result.refreshToken,
      result.refreshExpiresIn,
    );
    this.authService.setAccessCookie(res, result.accessToken);
    const { accounts, ...user } = result.user;
    return {
      message: 'User logged in successfully',
      ...user,
    };
  }

  @Public()
  @UseGuards(GoogleAuthGuard)
  @Get('google')
  @ApiOperation({
    summary: 'Google OAuth Redirect',
    description: 'Redirects the user to the Google OAuth consent screen',
  })
  async google() {}

  @Public()
  @UseGuards(GoogleAuthGuard)
  @Get('google/callback')
  @ApiOperation({
    summary: 'Google OAuth Callback',
    description:
      'Handles Google OAuth callback, logs in the user, and sets cookies. (Called by Google)',
  })
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];
    const result = await this.authService.login(
      req.user,
      ipAddress,
      userAgent,
      true,
    );

    if ('mfa_required' in result) {
      const redirectUrl = `${this.configService.get<string>('frontendUrl')}/auth/mfa?token=${result.mfa_token}`;
      return res.redirect(redirectUrl);
    }

    this.authService.setRefreshCookie(
      res,
      result.refreshToken,
      result.refreshExpiresIn,
    );
    this.authService.setAccessCookie(res, result.accessToken);

    const redirectUrl = this.configService.get<string>('frontendUrl')!;
    return res.redirect(redirectUrl);
  }

  @Public()
  @UseGuards(MicrosoftAuthGuard)
  @Get('microsoft')
  @ApiOperation({
    summary: 'Microsoft OAuth Redirect',
    description: 'Redirects the user to the Microsoft OAuth consent screen',
  })
  async microsoft() {}

  @Public()
  @UseGuards(MicrosoftAuthGuard)
  @Get('microsoft/callback')
  @ApiOperation({
    summary: 'Microsoft OAuth Callback',
    description:
      'Handles Microsoft OAuth callback, logs in the user, and sets cookies. (Called by Microsoft)',
  })
  async microsoftCallback(@Req() req: Request, @Res() res: Response) {
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];
    const result = await this.authService.login(
      req.user,
      ipAddress,
      userAgent,
      true,
    );

    if ('mfa_required' in result) {
      const redirectUrl = `${this.configService.get<string>('frontendUrl')}/auth/mfa?token=${result.mfa_token}`;
      return res.redirect(redirectUrl);
    }

    this.authService.setRefreshCookie(
      res,
      result.refreshToken,
      result.refreshExpiresIn,
    );
    this.authService.setAccessCookie(res, result.accessToken);

    const redirectUrl = this.configService.get<string>('frontendUrl')!;
    return res.redirect(redirectUrl);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh User Session',
    description:
      'Rotates user session token, updates secure cookie, and issues a new access token.',
  })
  @ApiResponse({ status: 200, type: UserSuccessResponseDto })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!token) {
      throw new UnauthorizedException('Refresh token missing');
    }

    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];
    const result = await this.authService.refreshTokens(
      token,
      ipAddress,
      userAgent,
    );
    this.authService.setRefreshCookie(
      res,
      result.refreshToken,
      result.refreshExpiresIn,
    );
    this.authService.setAccessCookie(res, result.accessToken);
    const { accounts, ...user } = result.user;
    return {
      message: 'Token refreshed successfully',
      ...user,
    };
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User Logout',
    description:
      'Revokes and deletes the current session from the database, and clears the secure cookie.',
  })
  @ApiResponse({ status: 200, type: MessageResponseEnvelopeDto })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    if (token) {
      await this.authService.signout(token);
    }
    this.authService.clearCookies(res);
    return {
      message: 'User logged out successfully',
    };
  }

  @Public()
  @Post('login/mfa')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'MFA TOTP Verification',
    description:
      'Verifies the TOTP code provided by the user and completes login by setting auth cookies.',
  })
  @ApiResponse({ status: 200, type: UserSuccessResponseDto })
  async loginMfa(
    @Body() verifyMfaDto: VerifyMfaDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];
    const result = await this.authService.verifyMfaCode(
      verifyMfaDto.mfaToken,
      verifyMfaDto.code,
      ipAddress,
      userAgent,
    );
    this.authService.setRefreshCookie(
      res,
      result.refreshToken,
      result.refreshExpiresIn,
    );
    this.authService.setAccessCookie(res, result.accessToken);
    const { accounts, ...user } = result.user;
    return {
      message: 'MFA validation successful',
      ...user,
    };
  }

  @Post('mfa/setup')
  @RequirePermissions()
  @ApiOperation({
    summary: 'Initiate TOTP MFA Setup',
    description:
      'Generates a new TOTP secret and QR-Code for the user to scan inorder to setup mfa',
  })
  @ApiResponse({ status: 200, type: MfaSetupSuccessResponseDto })
  async setupMfa(@Req() req: Request) {
    const userId = (req.user as any).id;
    return this.authService.generateMfaSecret(userId);
  }

  @Post('mfa/confirm')
  @RequirePermissions()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Confirm TOTP MFA Setup',
    description:
      'Confirms the TOTP code provided by the user and enables MFA for the account.',
  })
  @ApiResponse({ status: 200, type: SuccessResponseEnvelopeDto })
  async confirmMfa(@Req() req: Request, @Body() confirmMfaDto: ConfirmMfaDto) {
    const userId = (req.user as any).id;
    return this.authService.confirmMfaSetup(userId, confirmMfaDto.code);
  }

  @Put('mfa')
  @RequirePermissions()
  @ApiOperation({
    summary: 'Disable TOTP MFA',
    description: 'Disables TOTP MFA for an account',
  })
  @ApiResponse({ status: 200, type: SuccessResponseEnvelopeDto })
  async disableMfa(@Req() req: Request, @Body() disableMfaDto: DisableMfaDto) {
    const userId = (req.user as any).id;
    return this.authService.disableMfa(userId, disableMfaDto.code);
  }

  @Public()
  @Get('verify-email')
  @ApiOperation({
    summary: 'Email Verification Callback',
    description:
      'Verifies the email verification token and redirects the user to the /dashboard.',
  })
  async verifyEmail(@Query('token') token: string, @Res() res: Response) {
    await this.authService.verifyEmail(token);
    const redirectUrl = `${this.configService.get<string>('frontendUrl')}/dashboard`;
    return res.redirect(redirectUrl);
  }

  @Post('verify-email/request')
  @RequirePermissions()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resend Email Verification Link',
    description:
      'Requests a new email verification link email for the user if not already verified.',
  })
  @ApiResponse({ status: 200, type: MessageResponseEnvelopeDto })
  async requestEmailVerification(@Req() req: Request) {
    const userId = (req.user as any).id;
    await this.authService.sendVerificationEmail(userId);
    return { message: 'Verification email has been resent successfully' };
  }

  @Public()
  @Post('password/reset-request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Password Reset Request',
    description: 'Requests a new password reset link email for the user .',
  })
  @ApiResponse({ status: 200, type: MessageResponseEnvelopeDto })
  async resetPasswordRequest(
    @Body() passwordResetRequestDto: PasswordResetRequestDto,
  ) {
    await this.authService.passwordResetRequest(passwordResetRequestDto.email);
    return { message: 'Password reset request dispatched successfully' };
  }

  @Public()
  @Post('password/reset-confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Password Reset Confirmation',
    description:
      'Confirms the password reset request and updates the user password.',
  })
  @ApiResponse({ status: 200, type: MessageResponseEnvelopeDto })
  async resetPasswordConfirm(
    @Body() passwordResetConfirmDto: PasswordResetConfirmDto,
  ) {
    await this.authService.passwordResetConfirm(
      passwordResetConfirmDto.token,
      passwordResetConfirmDto.password,
    );
    return { message: 'Password has been reset successfully' };
  }

  @Put('onboarding/profile')
  @RequirePermissions()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update Onboarding Profile',
    description: 'Updates the user role and country during onboarding.',
  })
  @ApiResponse({ status: 200, type: UserSuccessResponseDto })
  async onboardProfile(
    @Req() req: Request,
    @Body() onboardingProfileDto: OnboardingProfileDto,
  ) {
    const userId = (req.user as any).id;
    const user = await this.authService.onboardProfile(
      userId,
      onboardingProfileDto.role,
      onboardingProfileDto.country,
    );
    return user;
  }

  @Get('mfa/status')
  @RequirePermissions()
  @ApiOperation({
    summary: 'Get MFA Status',
    description: 'Checks if TOTP MFA is configured and enabled for the user.',
  })
  @ApiResponse({ status: 200, type: MfaStatusSuccessResponseDto })
  async getMfaStatus(@Req() req: Request) {
    const userId = (req.user as any).id;
    return this.authService.getMfaStatus(userId);
  }

  @Get('me')
  @RequirePermissions()
  @ApiOperation({
    summary: 'Get Authenticated User Profile',
    description: 'Returns the details of the logged in user.',
  })
  @ApiResponse({ status: 200, type: UserSuccessResponseDto })
  async getMe(@Req() req: Request) {
    const userId = (req.user as any).id;
    return this.authService.getMe(userId);
  }
}
