import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-microsoft';
import { AuthService } from '../auth.service';

@Injectable()
export class MicrosoftStrategy extends PassportStrategy(Strategy, 'microsoft') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>('microsoftOAuth.clientID') || 'microsoft-client-id-placeholder',
      clientSecret: configService.get<string>('microsoftOAuth.clientSecret') || 'microsoft-client-secret-placeholder',
      callbackURL: configService.get<string>('microsoftOAuth.callbackURL') || 'http://localhost:8001/api/v1/auth/microsoft/callback',
      scope: ['user.read'],
      tenant: 'common',
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: (err: any, user?: any, info?: any) => void,
  ): Promise<any> {
    try {
      const user = await this.authService.validateMicrosoftUser(profile);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  }
}
