const jwt = require('jsonwebtoken');
const { ERROR_MESSAGES } = require('../constants/messages');
const { STATUS_CODES } = require('../constants/statusCodes');
const { USER_ROLES } = require('../constants/config');
const environment = require('../config/environment');
const logger = require('../config/logger');
const { sendErrorResponse } = require('../utils/response');

/**
 * Verify JWT token and attach user to request
 */
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return sendErrorResponse(res, STATUS_CODES.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
    }

    try {
        const decoded = jwt.verify(token, environment.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        logger.error('Token verification failed:', error.message);

        if (error.name === 'TokenExpiredError') {
            return sendErrorResponse(res, STATUS_CODES.UNAUTHORIZED, ERROR_MESSAGES.TOKEN_EXPIRED);
        }

        return sendErrorResponse(res, STATUS_CODES.UNAUTHORIZED, ERROR_MESSAGES.INVALID_TOKEN);
    }
};

/**
 * Check if user has admin role
 */
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return sendErrorResponse(res, STATUS_CODES.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
    }

    if (req.user.role !== USER_ROLES.ADMIN) {
        return sendErrorResponse(res, STATUS_CODES.FORBIDDEN, ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS);
    }

    next();
};

/**
 * Check if user has required role
 */
const requireRole = (requiredRole) => {
    return (req, res, next) => {
        if (!req.user) {
            return sendErrorResponse(res, STATUS_CODES.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
        }

        if (req.user.role !== requiredRole && req.user.role !== USER_ROLES.ADMIN) {
            return sendErrorResponse(res, STATUS_CODES.FORBIDDEN, ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS);
        }

        next();
    };
};

/**
 * Optional authentication - doesn't fail if no token provided
 */
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return next();
    }

    try {
        const decoded = jwt.verify(token, environment.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        // Don't fail for optional auth, just continue without user
        logger.warn('Optional auth failed:', error.message);
        next();
    }
};

/**
 * Check if user owns the resource or is admin
 */
const requireOwnership = (resourceUserIdField = 'userId') => {
    return (req, res, next) => {
        if (!req.user) {
            return sendErrorResponse(res, STATUS_CODES.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
        }

        // Admin can access any resource
        if (req.user.role === USER_ROLES.ADMIN) {
            return next();
        }

        // Check if user owns the resource
        const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];

        if (!resourceUserId) {
            return sendErrorResponse(res, STATUS_CODES.BAD_REQUEST, 'Resource user ID not found');
        }

        if (req.user.id !== resourceUserId && req.user.email !== resourceUserId) {
            return sendErrorResponse(res, STATUS_CODES.FORBIDDEN, ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS);
        }

        next();
    };
};

module.exports = {
    authenticateToken,
    requireAdmin,
    requireRole,
    optionalAuth,
    requireOwnership
}; 