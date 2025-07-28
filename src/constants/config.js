// Application Configuration Constants
const APP_CONFIG = {
    // API Configuration
    API_VERSION: 'v1',
    API_PREFIX: '/api',
    DEFAULT_PAGE_SIZE: 10,
    MAX_PAGE_SIZE: 100,

    // Pagination
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,

    // File Upload
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    UPLOAD_PATH: 'uploads/',

    // Validation
    PASSWORD_MIN_LENGTH: 6,
    PASSWORD_MAX_LENGTH: 128,
    EMAIL_MAX_LENGTH: 254,
    DISPLAY_NAME_MIN_LENGTH: 2,
    DISPLAY_NAME_MAX_LENGTH: 50,

    // Review System
    MIN_RATING: 1,
    MAX_RATING: 5,

    // Cache Configuration
    CACHE_TTL: 300, // 5 minutes
    CACHE_MAX_SIZE: 1000,

    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    RATE_LIMIT_MAX_REQUESTS: 100,

    // JWT Configuration
    JWT_EXPIRES_IN: '7d',
    JWT_REFRESH_EXPIRES_IN: '30d',

    // Database Configuration
    DB_CONNECTION_TIMEOUT: 30000,
    DB_SOCKET_TIMEOUT: 45000,

    // Logging
    LOG_LEVELS: {
        ERROR: 'error',
        WARN: 'warn',
        INFO: 'info',
        DEBUG: 'debug'
    },

    // Environment
    ENVIRONMENTS: {
        DEVELOPMENT: 'development',
        TESTING: 'testing',
        STAGING: 'staging',
        PRODUCTION: 'production'
    }
};

// User Roles
const USER_ROLES = {
    USER: 'user',
    ADMIN: 'admin'
};

// Order Status
const ORDER_STATUS = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    PROCESSING: 'processing',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled'
};

// Payment Status
const PAYMENT_STATUS = {
    PENDING: 'pending',
    PAID: 'paid',
    FAILED: 'failed',
    REFUNDED: 'refunded'
};

// Service Categories
const SERVICE_CATEGORIES = {
    ELECTRONICS: 'electronics',
    CLOTHING: 'clothing',
    HOME: 'home',
    BEAUTY: 'beauty',
    SPORTS: 'sports',
    BOOKS: 'books',
    OTHER: 'other'
};

module.exports = {
    APP_CONFIG,
    USER_ROLES,
    ORDER_STATUS,
    PAYMENT_STATUS,
    SERVICE_CATEGORIES
}; 