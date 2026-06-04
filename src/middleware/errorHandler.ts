import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import {
    getErrorMessage,
    getErrorName,
    getErrorCode,
    getErrorProperty,
} from '../utils/errorHandler';

const errorHandler = (err: Error | unknown, req: Request, res: Response, next: NextFunction) => {
    const errorObj = err instanceof Error ? err : new Error(String(err));
    logger.error('Error occurred:', {
        message: errorObj.message,
        stack: errorObj.stack,
        url: req.url,
        method: req.method,
        correlationId: req.headers['x-correlation-id'],
    });

    if (errorObj.name === 'ValidationError') {
        const errors = Object.values(
            (getErrorProperty(err, 'errors') as Record<string, unknown>) || {},
        ).map((error: any) => (error instanceof Error ? getErrorMessage(error) : String(error)));
        return res.status(400).json({
            success: false,
            error: 'Validation Error',
            details: errors,
        });
    }

    if (errorObj.name === 'CastError') {
        return res.status(400).json({
            success: false,
            error: 'Invalid ID format',
        });
    }

    const mongoError = err as Record<string, unknown>;
    if (getErrorCode(err) === 11000) {
        const field = Object.keys((mongoError.keyValue as Record<string, unknown>) || {})[0];
        return res.status(400).json({
            success: false,
            error: `${field} already exists`,
        });
    }

    if (errorObj.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            error: 'Invalid token',
        });
    }

    if (errorObj.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            error: 'Token expired',
        });
    }

    const statusCode = (mongoError.status as number) || 500;
    const publicMessage =
        statusCode >= 500
            ? 'Something went wrong. Please try again.'
            : errorObj.message || 'Internal server error';

    res.status(statusCode).json({
        success: false,
        error: publicMessage,
    });
};

const methodNotAllowedHandler = (req: Request, res: Response) => {
    logger.warn('Method not allowed:', {
        url: req.url,
        method: req.method,
        correlationId: req.headers['x-correlation-id'],
    });
    res.status(405).json({
        success: false,
        error: 'Method Not Allowed',
    });
};

const notFoundHandler = (req: Request, res: Response) => {
    logger.warn('Route not found:', {
        url: req.url,
        method: req.method,
        correlationId: req.headers['x-correlation-id'],
    });
    res.status(404).json({
        success: false,
        error: 'Route not found',
    });
};

export { errorHandler, notFoundHandler, methodNotAllowedHandler };
