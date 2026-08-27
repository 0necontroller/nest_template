import { Test, TestingModule } from '@nestjs/testing';
import { TwoFactorService } from './two-factor.service';
import { generateSecret, verify, generateURI } from 'otplib';
import * as QRCode from 'qrcode';

jest.mock('otplib', () => ({
  generateSecret: jest.fn(),
  verify: jest.fn(),
  generateURI: jest.fn(),
}));

jest.mock('qrcode', () => ({
  toDataURL: jest.fn(),
}));

describe('TwoFactorService', () => {
  let service: TwoFactorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TwoFactorService],
    }).compile();

    service = module.get<TwoFactorService>(TwoFactorService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateTwoFactorAuthenticationSecret', () => {
    it('should generate a secret and return URI', () => {
      (generateSecret as jest.Mock).mockReturnValue('secret123');
      (generateURI as jest.Mock).mockReturnValue('otpauth://totp/NestJSTemplate:user@example.com?secret=secret123');

      const result = service.generateTwoFactorAuthenticationSecret('user@example.com');

      expect(result).toEqual({
        secret: 'secret123',
        otpauthUrl: 'otpauth://totp/NestJSTemplate:user@example.com?secret=secret123',
      });
      expect(generateSecret).toHaveBeenCalled();
      expect(generateURI).toHaveBeenCalledWith({
        issuer: 'NestJSTemplate',
        label: 'user@example.com',
        secret: 'secret123',
      });
    });
  });

  describe('pipeQrCodeStream', () => {
    it('should return base64 data URL from QR Code generation', async () => {
      (QRCode.toDataURL as jest.Mock).mockResolvedValue('data:image/png;base64,123');

      const result = await service.pipeQrCodeStream('otpauth://totp/...');

      expect(result).toBe('data:image/png;base64,123');
      expect(QRCode.toDataURL).toHaveBeenCalledWith('otpauth://totp/...');
    });
  });

  describe('isTwoFactorAuthenticationCodeValid', () => {
    it('should verify code and return true if valid', async () => {
      (verify as jest.Mock).mockResolvedValue({ valid: true });

      const result = await service.isTwoFactorAuthenticationCodeValid('123456', 'secret123');

      expect(result).toBe(true);
      expect(verify).toHaveBeenCalledWith({
        token: '123456',
        secret: 'secret123',
      });
    });

    it('should verify code and return false if invalid', async () => {
      (verify as jest.Mock).mockResolvedValue({ valid: false });

      const result = await service.isTwoFactorAuthenticationCodeValid('111111', 'secret123');

      expect(result).toBe(false);
      expect(verify).toHaveBeenCalledWith({
        token: '111111',
        secret: 'secret123',
      });
    });
  });
});
