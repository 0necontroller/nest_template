import { Logger } from '@nestjs/common';
import { type AppConfig, envSchema } from './config.validate';

export default function AppConfig(): AppConfig {
  const config = {
    port: parseInt(process.env.PORT ?? '8001', 10),
    environment: process.env.NODE_ENV,
    databaseUrl: process.env.DATABASE_URL,
    refreshJwt: {
      secret: process.env.REFRESH_JWT_SECRET,
      expiresIn: Number(process.env.REFRESH_JWT_EXPIRES_IN),
    },
    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: Number(process.env.JWT_EXPIRES_IN),
    },
    googleOAuth: {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL!,
    },
  };

  const result = envSchema.safeParse(config);

  if (result.error) {
    Logger.error(
      'Error validating environment variable\n',
      result.error.message,
    );
    throw new Error(result.error.message);
  }

  return result.data;
}
