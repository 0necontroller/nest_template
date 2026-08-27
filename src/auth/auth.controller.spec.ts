import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { Response, Request } from 'express';

jest.mock('otplib', () => ({
  generateSecret: jest.fn(),
  verify: jest.fn(),
  generateURI: jest.fn(),
}));

describe('AuthController', () => {
  let controller: AuthController;
  let authService: any;
  let configService: any;

  const mockUser = {
    id: 'user-id-1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'USER',
  };

  const mockResponse = {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  } as unknown as Response;

  const mockRequest = {
    ip: '127.0.0.1',
    headers: { 'user-agent': 'test-agent' },
    cookies: { refreshToken: 'refresh-token-cookie' },
    user: mockUser,
  } as unknown as Request;

  beforeEach(async () => {
    const mockAuthService = {
      register: jest.fn(),
      login: jest.fn(),
      refreshTokens: jest.fn(),
      signout: jest.fn(),
      setRefreshCookie: jest.fn(),
      setAccessCookie: jest.fn(),
      clearCookies: jest.fn(),
      onboardProfile: jest.fn(),
      getMfaStatus: jest.fn(),
      getMe: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register user', async () => {
      const dto = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        country: 'US',
        role: 'USER',
        acceptedTerms: true,
      };
      authService.register.mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        refreshExpiresIn: 604800,
        user: mockUser,
      });

      const result = await controller.register(dto, mockRequest, mockResponse);
      expect(result).toEqual({
        message: 'User registered successfully',
        ...mockUser,
      });
      expect(authService.register).toHaveBeenCalledWith(dto, '127.0.0.1', 'test-agent');
    });
  });

  describe('onboardProfile', () => {
    it('should update role and country', async () => {
      const dto = { role: 'ADMIN', country: 'DE' };
      authService.onboardProfile.mockResolvedValue(mockUser);

      const result = await controller.onboardProfile(mockRequest, dto);
      expect(result).toEqual(mockUser);
      expect(authService.onboardProfile).toHaveBeenCalledWith('user-id-1', 'ADMIN', 'DE');
    });
  });

  describe('getMfaStatus', () => {
    it('should query mfa setup flag', async () => {
      authService.getMfaStatus.mockResolvedValue({ mfaEnabled: false });

      const result = await controller.getMfaStatus(mockRequest);
      expect(result).toEqual({ mfaEnabled: false });
      expect(authService.getMfaStatus).toHaveBeenCalledWith('user-id-1');
    });
  });

  describe('getMe', () => {
    it('should return current user profile', async () => {
      authService.getMe.mockResolvedValue(mockUser);

      const result = await controller.getMe(mockRequest);
      expect(result).toEqual(mockUser);
      expect(authService.getMe).toHaveBeenCalledWith('user-id-1');
    });
  });
});
