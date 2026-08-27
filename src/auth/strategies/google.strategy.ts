import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>('googleOAuth.clientID')!,
      clientSecret: configService.get<string>('googleOAuth.clientSecret')!,
      callbackURL: configService.get<string>('googleOAuth.callbackURL')!,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string, // this unread field is Required by parent class
    refreshToken: string, // this unread field is Required by parent class
    profile: Profile,
    done: (err: any, user?: any, info?: any) => void,
  ): Promise<any> {
    try {
      const user = await this.authService.validateGoogleUser(profile);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  }
}
