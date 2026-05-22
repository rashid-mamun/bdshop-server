export const APP_CONFIG = {
    API_VERSION: 'v1',
    API_PREFIX: '/api',
    DEFAULT_PAGE_SIZE: 10,
    MAX_PAGE_SIZE: 100,

    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,

    MAX_FILE_SIZE: 10 * 1024 * 1024,
    ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    UPLOAD_PATH: 'uploads/',

    PASSWORD_MIN_LENGTH: 6,
    PASSWORD_MAX_LENGTH: 128,
    EMAIL_MAX_LENGTH: 254,
    DISPLAY_NAME_MIN_LENGTH: 2,
    DISPLAY_NAME_MAX_LENGTH: 50,

    MIN_RATING: 1,
    MAX_RATING: 5,

    CACHE_TTL: 300,
    CACHE_MAX_SIZE: 1000,

    RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000,
    RATE_LIMIT_MAX_REQUESTS: 100,

    JWT_EXPIRES_IN: '7d',
    JWT_REFRESH_EXPIRES_IN: '30d',

    DB_CONNECTION_TIMEOUT: 30000,
    DB_SOCKET_TIMEOUT: 45000,

    LOG_LEVELS: {
        ERROR: 'error',
        WARN: 'warn',
        INFO: 'info',
        DEBUG: 'debug',
    },

    ENVIRONMENTS: {
        DEVELOPMENT: 'development',
        TESTING: 'testing',
        STAGING: 'staging',
        PRODUCTION: 'production',
    },
};

export const USER_ROLES = {
    USER: 'user',
    ADMIN: 'admin',
    SUPER_ADMIN: 'superadmin',
};

export const ORDER_STATUS = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    PROCESSING: 'processing',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
};

export const PAYMENT_STATUS = {
    PENDING: 'pending',
    PAID: 'paid',
    FAILED: 'failed',
    REFUNDED: 'refunded',
};

export const SERVICE_CATEGORIES = {
    ELECTRONICS: 'electronics',
    CLOTHING: 'clothing',
    HOME: 'home',
    BEAUTY: 'beauty',
    SPORTS: 'sports',
    BOOKS: 'books',
    OTHER: 'other',
};
