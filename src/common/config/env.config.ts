import { Logger } from '@nestjs/common';
import { type AppConfig, envSchema } from './env.config.validate';

export default function AppConfig(): AppConfig {
  const config = {
    port: parseInt(process.env.PORT ?? '8001', 10),
    environment: process.env.NODE_ENV,
    allowedOrigins: process.env.ALLOWED_ORIGINS,
    frontendUrl: process.env.FRONTEND_URL,
    databaseUrl: process.env.DATABASE_URL,
    refreshJwt: {
      secret: process.env.REFRESH_JWT_SECRET,
      expiresIn: process.env.REFRESH_JWT_EXPIRES_IN
        ? Number(process.env.REFRESH_JWT_EXPIRES_IN)
        : undefined,
    },
    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN
        ? Number(process.env.JWT_EXPIRES_IN)
        : undefined,
    },
    googleOAuth: {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    microsoftOAuth: {
      clientID: process.env.MICROSOFT_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
      callbackURL: process.env.MICROSOFT_CALLBACK_URL,
    },
    redis: {
      url: process.env.REDIS_URL,
      password: process.env.REDIS_PASSWORD,
    },
    aws: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      storageBucketName: process.env.AWS_STORAGE_BUCKET_NAME,
      s3EndpointUrl: process.env.AWS_S3_ENDPOINT_URL,
      s3RegionName: process.env.AWS_S3_REGION_NAME,
    },
    email: {
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : undefined,
      hostUser: process.env.EMAIL_HOST_USER,
      hostPassword: process.env.EMAIL_HOST_PASSWORD,
      defaultFromEmail: process.env.DEFAULT_FROM_EMAIL,
      serverEmail: process.env.SERVER_EMAIL,
    },
    sentry: {
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: process.env.SENTRY_TRACES_SAMPLE_RATE
        ? Number(process.env.SENTRY_TRACES_SAMPLE_RATE)
        : undefined,
    },
    mfa: {
      otpTotpIssuer: process.env.OTP_TOTP_ISSUER,
      tpTotpIssuer: process.env.TP_TOTP_ISSUER,
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
