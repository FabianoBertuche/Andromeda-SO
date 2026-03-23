import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().default(5000),
    DATABASE_URL: z.string().url(),
    REDIS_URL: z.string().url().optional(),

    // Auth
    JWT_SECRET: z.string().min(32),
    JWT_ACCESS_EXPIRES: z.string().default('15m'),
    JWT_REFRESH_EXPIRES: z.string().default('30d'),
    BCRYPT_ROUNDS: z.coerce.number().min(10).default(10),

    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
    RATE_LIMIT_MAX: z.coerce.number().default(100),
    RATE_LIMIT_AUTH_MAX: z.coerce.number().default(5),

    // Services
    COGNITIVE_PYTHON_URL: z.string().url().default('http://127.0.0.1:8008'),
    COGNITIVE_PYTHON_TOKEN: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

const result = envSchema.safeParse(process.env);

if (!result.success) {
    console.error('❌ Invalid environment variables:', JSON.stringify(result.error.format(), null, 2));
    process.exit(1);
}

export const env = result.data;
