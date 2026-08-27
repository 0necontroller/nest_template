import { z } from 'zod';

export const envSchema = z.object({
  environment: z
    .enum(['development', 'production', 'staging'])
    .default('development'),
  port: z.coerce.number().default(8001),
  allowedOrigins: z.string().default('localhost,127.0.0.1'),
  frontendUrl: z.string().default('http://localhost:3000'),
  databaseUrl: z.string(),

  // Auth JWT
  refreshJwt: z.object({
    secret: z.string(),
    expiresIn: z.coerce.number(),
  }),
  jwt: z.object({
    secret: z.string(),
    expiresIn: z.coerce.number(),
  }),

  // Google OAuth
  googleOAuth: z.object({
    clientID: z.string(),
    clientSecret: z.string(),
    callbackURL: z.string(),
  }),
  // Microsoft OAuth
  microsoftOAuth: z.object({
    clientID: z.string(),
    clientSecret: z.string(),
    callbackURL: z.string(),
  }),
  // Redis
  redis: z.object({
    url: z.string(),
    password: z.string(),
  }),
  // AWS S3 / MinIO
  aws: z.object({
    accessKeyId: z.string(),
    secretAccessKey: z.string(),
    storageBucketName: z.string(),
    s3EndpointUrl: z.string(),
    s3RegionName: z.string(),
  }),
  // Email
  email: z.object({
    host: z.string(),
    port: z.coerce.number(),
    hostUser: z.string(),
    hostPassword: z.string(),
    defaultFromEmail: z.string(),
    serverEmail: z.string(),
  }),
  // Sentry
  sentry: z.object({
    dsn: z.string(),
    tracesSampleRate: z.coerce.number(),
  }),
  // MFA
  mfa: z.object({
    otpTotpIssuer: z.string(),
    tpTotpIssuer: z.string(),
  }),
});

export type AppConfig = z.infer<typeof envSchema>;
