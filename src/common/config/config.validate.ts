import { z } from 'zod';

export const envSchema = z.object({
  environment: z
    .enum(['development', 'production', 'staging'])
    .default('development'),
  port: z.coerce.number().default(8001),
  databaseUrl: z.string(),
  refreshJwt: z.object({
    secret: z.string(),
    expiresIn: z.number(),
  }),
  jwt: z.object({
    secret: z.string(),
    expiresIn: z.number(),
  }),
  googleOAuth: z.object({
    clientID: z.string(),
    clientSecret: z.string(),
    callbackURL: z.string(),
  }),
});

export type AppConfig = z.infer<typeof envSchema>;
