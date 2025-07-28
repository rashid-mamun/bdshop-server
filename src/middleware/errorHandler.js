const { logger } = require('../utils/logger');

// Centralized error handler
const errorHandler = (err, req, res, next) => {
    logger.error('Error occurred:', {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        correlationId: req.headers['x-correlation-id']
    });

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(error => error.message);
        return res.status(400).json({
            success: false,
            error: 'Validation Error',
            details: errors
        });
    }

    // Mongoose cast error (invalid ObjectId)
    if (err.name === 'CastError') {
        return res.status(400).json({
            success: false,
            error: 'Invalid ID format'
        });
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return res.status(400).json({
            success: false,
            error: `${field} already exists`
        });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            error: 'Invalid token'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            error: 'Token expired'
        });
    }

    // Default error
    res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Internal server error'
    });
};

// 405 handler
const methodNotAllowedHandler = (req, res) => {
    logger.warn('Method not allowed:', {
        url: req.url,
        method: req.method,
        correlationId: req.headers['x-correlation-id']
    });
    res.status(405).json({
        success: false,
        error: 'Method Not Allowed'
    });
};

// 404 handler
const notFoundHandler = (req, res) => {
    logger.warn('Route not found:', {
        url: req.url,
        method: req.method,
        correlationId: req.headers['x-correlation-id']
    });
    res.status(404).json({
        success: false,
        error: 'Route not found'
    });
};

module.exports = {
    errorHandler,
    notFoundHandler
};
module.exports.methodNotAllowedHandler = methodNotAllowedHandler; 