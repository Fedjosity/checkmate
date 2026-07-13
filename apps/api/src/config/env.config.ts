import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('4000').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  FIREBASE_SERVICE_ACCOUNT_JSON: z.string().optional(),
  FLW_PUBLIC_KEY: z.string().optional(),
  FLW_SECRET_KEY: z.string().optional(),
  FLW_WEBHOOK_SECRET: z.string().optional(),
  WEB_URL: z.string().default('http://localhost:3000'),
  API_URL: z.string().default('http://localhost:4000/api/v1'),
  DIDIT_API_KEY: z.string().optional(),
  DIDIT_WORKFLOW_ID: z.string().optional(),
  DIDIT_WEBHOOK_SECRET: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  ZEPTOMAIL_API_KEY: z.string().optional(),
  ZEPTOMAIL_URL: z.string().default('https://api.zeptomail.com/v1.1/email'),
  ZEPTOMAIL_FROM_EMAIL: z.string().default('hello@playcheckmate.app'),
  ZEPTOMAIL_FROM_NAME: z.string().default('Play CheckMate Africa'),
  EMAIL_PROVIDER: z.enum(['resend', 'zeptomail']).default('resend'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:', _env.error.format());
  process.exit(1);
}

export const env = _env.data;
