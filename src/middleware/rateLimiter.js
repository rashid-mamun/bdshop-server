const rateLimit = require('express-rate-limit');
const { STATUS_CODES } = require('../constants/statusCodes');
const { ERROR_MESSAGES } = require('../constants/messages');
const environment = require('../config/environment');
const logger = require('../config/logger');

// Store for rate limiting (in production, use Redis)
const rateLimitStore = new Map();

// Clean up expired entries every 15 minutes (only in production)
if (process.env.NODE_ENV === 'production') {
    setInterval(() => {
        const now = Date.now();
        for (const [key, value] of rateLimitStore.entries()) {
            if (now > value.resetTime) {
                rateLimitStore.delete(key);
            }
        }
    }, 15 * 60 * 1000);
}

/**
 * Create a rate limiter middleware
 */
const createRateLimiter = (options = {}) => {
    const {
        windowMs = environment.RATE_LIMIT_WINDOW_MS,
        max = environment.RATE_LIMIT_MAX_REQUESTS,
        message = ERROR_MESSAGES.TOO_MANY_REQUESTS,
        statusCode = STATUS_CODES.TOO_MANY_REQUESTS,
        keyGenerator = (req) => req.ip,
        skipSuccessfulRequests = false,
        skipFailedRequests = false
    } = options;

    return rateLimit({
        windowMs,
        max,
        message: {
            success: false,
            error: message,
            retryAfter: Math.ceil(windowMs / 1000)
        },
        statusCode,
        keyGenerator,
        skipSuccessfulRequests,
        skipFailedRequests,
        handler: (req, res) => {
            logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
            res.status(statusCode).json({
                success: false,
                error: message,
                retryAfter: Math.ceil(windowMs / 1000)
            });
        },
        standardHeaders: true,
        legacyHeaders: false
    });
};

// Default rate limiter for all routes
const defaultRateLimiter = createRateLimiter();

// Stricter rate limiter for authentication routes
const authRateLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per window
    message: 'Too many authentication attempts, please try again later'
});

// Rate limiter for API endpoints
const apiRateLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: 'Too many API requests, please try again later'
});

// Rate limiter for file uploads
const uploadRateLimiter = createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 uploads per hour
    message: 'Too many file uploads, please try again later'
});

// Rate limiter for search endpoints
const searchRateLimiter = createRateLimiter({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 30, // 30 searches per 5 minutes
    message: 'Too many search requests, please try again later'
});

/**
 * Dynamic rate limiter based on user role
 */
const dynamicRateLimiter = (req, res, next) => {
    const user = req.user;
    let maxRequests = environment.RATE_LIMIT_MAX_REQUESTS;
    let windowMs = environment.RATE_LIMIT_WINDOW_MS;

    // Adjust limits based on user role
    if (user) {
        if (user.role === 'admin') {
            maxRequests = 1000; // Higher limit for admins
            windowMs = 15 * 60 * 1000;
        } else if (user.role === 'premium') {
            maxRequests = 500; // Higher limit for premium users
            windowMs = 15 * 60 * 1000;
        }
    }

    const limiter = createRateLimiter({
        windowMs,
        max: maxRequests,
        keyGenerator: (req) => user ? user.id : req.ip
    });

    return limiter(req, res, next);
};

module.exports = {
    createRateLimiter,
    defaultRateLimiter,
    authRateLimiter,
    apiRateLimiter,
    uploadRateLimiter,
    searchRateLimiter,
    dynamicRateLimiter
}; 