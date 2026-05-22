import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ERROR_MESSAGES } from '../constants/messages';
import {
    getErrorMessage,
    getErrorName,
    getErrorCode,
    getErrorProperty,
} from '../utils/errorHandler';
import { STATUS_CODES } from '../constants/statusCodes';
import { USER_ROLES } from '../constants/config';
import environment from '../config/environment';
import { logger } from '../utils/logger';
import { sendErrorResponse } from '../utils/response';

type RequestWithUser = Request & {
    user?: {
        id?: string;
        email?: string;
        role?: string;
    };
};

const isAdminRole = (role?: string) => role === USER_ROLES.ADMIN || role === USER_ROLES.SUPER_ADMIN;

const authenticateToken = (req: RequestWithUser, res: Response, next: NextFunction) => {
    let token = req.cookies?.accessToken;

    if (!token) {
        const authHeader = req.headers['authorization'];
        token = authHeader && authHeader.split(' ')[1];
    }

    if (!token) {
        return sendErrorResponse(res, STATUS_CODES.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
    }

    try {
        const decoded = jwt.verify(token, environment.JWT_SECRET as string);
        req.user = decoded as RequestWithUser['user'];
        next();
    } catch (error: Error | unknown) {
        const errorMessage = error instanceof Error ? getErrorMessage(error) : String(error);
        logger.error('Token verification failed:', errorMessage);

        if (error instanceof Error && getErrorName(error) === 'TokenExpiredError') {
            return sendErrorResponse(res, STATUS_CODES.UNAUTHORIZED, ERROR_MESSAGES.TOKEN_EXPIRED);
        }

        return sendErrorResponse(res, STATUS_CODES.UNAUTHORIZED, ERROR_MESSAGES.INVALID_TOKEN);
    }
};

const requireAdmin = (req: RequestWithUser, res: Response, next: NextFunction) => {
    if (!req.user) {
        return sendErrorResponse(res, STATUS_CODES.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
    }

    if (!isAdminRole(req.user.role)) {
        return sendErrorResponse(
            res,
            STATUS_CODES.FORBIDDEN,
            ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS,
        );
    }

    next();
};

const requireRole = (requiredRole: string) => {
    return (req: RequestWithUser, res: Response, next: NextFunction) => {
        if (!req.user) {
            return sendErrorResponse(res, STATUS_CODES.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
        }

        if (req.user.role !== requiredRole && !isAdminRole(req.user.role)) {
            return sendErrorResponse(
                res,
                STATUS_CODES.FORBIDDEN,
                ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS,
            );
        }

        next();
    };
};

const optionalAuth = (req: RequestWithUser, res: Response, next: NextFunction) => {
    let token = req.cookies?.accessToken;

    if (!token) {
        const authHeader = req.headers['authorization'];
        token = authHeader && authHeader.split(' ')[1];
    }

    if (!token) {
        return next();
    }

    try {
        const decoded = jwt.verify(token, environment.JWT_SECRET as string);
        req.user = decoded as RequestWithUser['user'];
        next();
    } catch (error: Error | unknown) {
        const errorMessage = error instanceof Error ? getErrorMessage(error) : String(error);
        logger.warn('Optional auth failed:', errorMessage);
        next();
    }
};

const requireOwnership = (resourceUserIdField = 'userId') => {
    return (req: RequestWithUser, res: Response, next: NextFunction) => {
        if (!req.user) {
            return sendErrorResponse(res, STATUS_CODES.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
        }

        if (isAdminRole(req.user.role)) {
            return next();
        }

        const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];

        if (!resourceUserId) {
            return sendErrorResponse(res, STATUS_CODES.BAD_REQUEST, 'Resource user ID not found');
        }

        if (req.user.id !== resourceUserId && req.user.email !== resourceUserId) {
            return sendErrorResponse(
                res,
                STATUS_CODES.FORBIDDEN,
                ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS,
            );
        }

        next();
    };
};

export { authenticateToken, requireAdmin, requireRole, optionalAuth, requireOwnership };
