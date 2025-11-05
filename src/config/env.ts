import 'dotenv/config';
import { z } from 'zod';

const Env = z.object({
    NODE_ENV: z.enum(['development','test','production']).default('development'),
    PORT: z.coerce.number().default(3200),

    DB_HOST: z.string(),
    DB_PORT: z.coerce.number().default(3306),
    DB_USER: z.string(),
    DB_PASSWORD: z.string(),
    DB_NAME: z.string(),

    DB_TIMEZONE: z.string().default('-05:00'), // America/Guayaquil
    JWT_SECRET: z.string().min(16, 'JWT_SECRET demasiado corto').default('cambia-esto-por-uno-seguro'),

  UPLOAD_DIR: z.string().default('public/images'),
  UPLOAD_MOUNT_PATH: z.string().default('/images'),
  UPLOAD_MAX_MB: z.coerce.number().default(2),
  PUBLIC_BASE_URL: z.string().default('http://localhost:3200'),
});

export const env = Env.parse(process.env);
