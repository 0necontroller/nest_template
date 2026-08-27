import { Injectable } from '@nestjs/common';
import { generateSecret, verify, generateURI } from 'otplib';
import * as QRCode from 'qrcode';

@Injectable()
export class TwoFactorService {
  public generateTwoFactorAuthenticationSecret(email: string) {
    const secret = generateSecret();
    const issuer = process.env.OTP_TOTP_ISSUER || 'NestJSTemplate';
    const otpauthUrl = generateURI({
      issuer,
      label: email,
      secret,
    });
    return {
      secret,
      otpauthUrl,
    };
  }

  public async pipeQrCodeStream(otpauthUrl: string): Promise<string> {
    return QRCode.toDataURL(otpauthUrl);
  }

  public async isTwoFactorAuthenticationCodeValid(
    code: string,
    secret: string,
  ): Promise<boolean> {
    const result = await verify({
      token: code,
      secret,
    });
    return result.valid;
  }
}
