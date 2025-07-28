require('dotenv').config();

const environment = {
    // Server Configuration
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInt(process.env.PORT, 10) || 3000,
    HOST: process.env.HOST || 'localhost',

    // Database Configuration
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/bdshop',
    MONGODB_URI_TEST: process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/bdshop_test',

    // JWT Configuration
    JWT_SECRET: process.env.JWT_SECRET || 'fallback-secret-key-change-in-production',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

    // Logging Configuration
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    LOG_FILE_PATH: process.env.LOG_FILE_PATH || 'logs/app.log',

    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000, // 15 minutes
    RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,

    // CORS Configuration
    CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',

    // API Configuration
    API_VERSION: process.env.API_VERSION || 'v1',
    API_PREFIX: process.env.API_PREFIX || '/api',

    // Email Configuration
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: parseInt(process.env.SMTP_PORT, 10) || 587,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,

    // File Upload Configuration
    MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE, 10) || 10485760, // 10MB
    UPLOAD_PATH: process.env.UPLOAD_PATH || 'uploads/'
};

// Validation
const requiredEnvVars = ['JWT_SECRET'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0 && environment.NODE_ENV === 'production') {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

module.exports = environment; 