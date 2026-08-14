import dotenv from 'dotenv';
dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const unsafeSecretValues = new Set([
    'your-super-secret-jwt-key-here',
    'fallback-secret-key-change-in-production',
    'fallback-refresh-secret-key-change-in-production',
]);

const getEnv = (key: string, fallback = ''): string => process.env[key] || fallback;
const getNumberEnv = (key: string, fallback: number): number => {
    const parsed = parseInt(process.env[key] || '', 10);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const environment = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: getNumberEnv('PORT', 5000),
    HOST: getEnv('HOST', 'localhost'),

    MONGODB_URI: getEnv('MONGODB_URI', 'mongodb://127.0.0.1:27017/bdshop'),
    MONGODB_URI_TEST: getEnv('MONGODB_URI_TEST', 'mongodb://localhost:27017/bdshop_test'),
    MONGODB_MEMORY_FALLBACK: process.env.MONGODB_MEMORY_FALLBACK === 'true',

    JWT_SECRET: getEnv('JWT_SECRET', isProduction ? undefined : 'dev-access-secret-change-me'),
    JWT_REFRESH_SECRET: getEnv(
        'JWT_REFRESH_SECRET',
        isProduction ? undefined : 'dev-refresh-secret-change-me',
    ),
    JWT_EXPIRES_IN: getEnv('JWT_EXPIRES_IN', '1h'),
    JWT_REFRESH_EXPIRES_IN: getEnv('JWT_REFRESH_EXPIRES_IN', '7d'),

    LOG_LEVEL: getEnv('LOG_LEVEL', 'info'),
    LOG_FILE_PATH: getEnv('LOG_FILE_PATH', 'logs/app.log'),

    RATE_LIMIT_WINDOW_MS: getNumberEnv('RATE_LIMIT_WINDOW_MS', 900000),
    RATE_LIMIT_MAX_REQUESTS: getNumberEnv('RATE_LIMIT_MAX_REQUESTS', 100),

    CORS_ORIGIN: getEnv('CORS_ORIGIN', 'http://localhost:5173'),
    FRONTEND_URL: getEnv('FRONTEND_URL', getEnv('CORS_ORIGIN', 'http://localhost:5173')),

    API_VERSION: getEnv('API_VERSION', 'v1'),
    API_PREFIX: getEnv('API_PREFIX', '/api'),

    CLOUDINARY_URL: process.env.CLOUDINARY_URL,
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: getNumberEnv('SMTP_PORT', 587),
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    EMAIL_FROM: getEnv('EMAIL_FROM', 'BD Shop <no-reply@bdshop.local>'),

    MAX_FILE_SIZE: getNumberEnv('MAX_FILE_SIZE', 10485760),
    UPLOAD_PATH: getEnv('UPLOAD_PATH', 'uploads/'),
};

const requiredEnvVars = [
    'MONGODB_URI',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'CORS_ORIGIN',
    'FRONTEND_URL',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'SMTP_HOST',
    'SMTP_USER',
    'SMTP_PASS',
    'EMAIL_FROM',
];
const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0 && environment.NODE_ENV === 'production') {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

if (
    environment.NODE_ENV === 'production' &&
    [environment.JWT_SECRET, environment.JWT_REFRESH_SECRET].some(
        (value) => !value || unsafeSecretValues.has(value) || value.length < 32,
    )
) {
    throw new Error(
        'JWT secrets must be unique, non-default, and at least 32 characters in production',
    );
}

export default environment;
