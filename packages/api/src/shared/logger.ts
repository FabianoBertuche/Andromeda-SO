import pino from 'pino';
import { env } from './config/env';

const isDevelopment = env.NODE_ENV === 'development';

export const logger = pino({
    level: isDevelopment ? 'debug' : 'info',
    transport: isDevelopment
        ? {
            target: 'pino-pretty',
            options: {
                colorize: true,
                ignore: 'pid,hostname',
            },
        }
        : undefined,
    redact: {
        paths: [
            'password',
            'passwordHash',
            'token',
            'refreshToken',
            'accessToken',
            'api_key',
            'apiKey',
            'keyHash',
            '*.password',
            '*.token',
            '*.api_key',
        ],
        remove: true,
    },
});
