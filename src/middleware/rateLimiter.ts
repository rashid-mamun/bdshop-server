import { NextFunction, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { STATUS_CODES } from '../constants/statusCodes';
import environment from '../config/environment';
import { logger } from '../utils/logger';

type RequestWithUser = Request & {
    user?: {
        id?: string;
        role?: string;
    };
};

type RateLimiterOptions = {
    windowMs?: number;
    max?: number;
    message?: string;
    statusCode?: number;
    keyGenerator?: (req: Request) => string;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
};

const createRateLimiter = (options: RateLimiterOptions = {}) => {
    const {
        windowMs = environment.RATE_LIMIT_WINDOW_MS,
        max = environment.RATE_LIMIT_MAX_REQUESTS,
        message = 'Too many requests, please try again later',
        statusCode = STATUS_CODES.TOO_MANY_REQUESTS,
        keyGenerator = (req) => req.ip || '',
        skipSuccessfulRequests = false,
        skipFailedRequests = false,
    } = options;

    return rateLimit({
        windowMs,
        max,
        message: {
            success: false,
            error: message,
            retryAfter: Math.ceil(windowMs / 1000),
        },
        statusCode,
        keyGenerator: (req: Request) => keyGenerator(req) || req.ip || '',
        skipSuccessfulRequests,
        skipFailedRequests,
        handler: (req, res) => {
            logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
            res.status(statusCode).json({
                success: false,
                error: message,
                retryAfter: Math.ceil(windowMs / 1000),
            });
        },
        standardHeaders: true,
        legacyHeaders: false,
    });
};

const defaultRateLimiter = createRateLimiter();

const authRateLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: environment.NODE_ENV === 'test' ? 1000 : 5,
    message: 'Too many authentication attempts, please try again later',
});

const apiRateLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many API requests, please try again later',
});

const uploadRateLimiter = createRateLimiter({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: 'Too many file uploads, please try again later',
});

const searchRateLimiter = createRateLimiter({
    windowMs: 5 * 60 * 1000,
    max: 30,
    message: 'Too many search requests, please try again later',
});

const standardDynamicLimiter = createRateLimiter({
    keyGenerator: (req: RequestWithUser) => req.user?.id || req.ip || '',
});

const premiumDynamicLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 500,
    keyGenerator: (req: RequestWithUser) => req.user?.id || req.ip || '',
});

const adminDynamicLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    keyGenerator: (req: RequestWithUser) => req.user?.id || req.ip || '',
});

const dynamicRateLimiter = (req: RequestWithUser, res: Response, next: NextFunction) => {
    if (req.user?.role === 'admin' || req.user?.role === 'superadmin') {
        return adminDynamicLimiter(req, res, next);
    }
    if (req.user?.role === 'premium') {
        return premiumDynamicLimiter(req, res, next);
    }
    return standardDynamicLimiter(req, res, next);
};

export {
    createRateLimiter,
    defaultRateLimiter,
    authRateLimiter,
    apiRateLimiter,
    uploadRateLimiter,
    searchRateLimiter,
    dynamicRateLimiter,
};
