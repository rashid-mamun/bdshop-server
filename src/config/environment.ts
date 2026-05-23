import dotenv from 'dotenv';
dotenv.config();

const environment = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInt(process.env.PORT as string, 10) || 5000,
    HOST: process.env.HOST || 'localhost',

    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bdshop',
    MONGODB_URI_TEST: process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/bdshop_test',
    MONGODB_MEMORY_FALLBACK: process.env.MONGODB_MEMORY_FALLBACK === 'true',

    JWT_SECRET: process.env.JWT_SECRET || 'fallback-secret-key-change-in-production',
    JWT_REFRESH_SECRET:
        process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret-key-change-in-production',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1h',
    JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    LOG_FILE_PATH: process.env.LOG_FILE_PATH || 'logs/app.log',

    RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS as string, 10) || 900000,
    RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS as string, 10) || 100,

    CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
    FRONTEND_URL: process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:5173',

    API_VERSION: process.env.API_VERSION || 'v1',
    API_PREFIX: process.env.API_PREFIX || '/api',

    CLOUDINARY_URL: process.env.CLOUDINARY_URL,
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,

    MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE as string, 10) || 10485760,
    UPLOAD_PATH: process.env.UPLOAD_PATH || 'uploads/',
};

const requiredEnvVars = ['JWT_SECRET', 'JWT_REFRESH_SECRET'];
const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0 && environment.NODE_ENV === 'production') {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

export default environment;
