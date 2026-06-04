import { Response } from 'express';
import { STATUS_CODES } from '../constants/statusCodes';
import {
    getErrorMessage,
    getErrorName,
    getErrorCode,
    getErrorProperty,
} from '../utils/errorHandler';

const createSuccessResponse = <T>(data: T, message = 'Success', statusCode = STATUS_CODES.OK) => {
    return {
        success: true,
        message,
        data,
        timestamp: new Date().toISOString(),
    };
};

const createErrorResponse = (
    error: Error | unknown,
    statusCode = STATUS_CODES.INTERNAL_SERVER_ERROR,
) => {
    const errorMessage = error instanceof Error ? getErrorMessage(error) : String(error);
    const publicMessage =
        statusCode >= STATUS_CODES.INTERNAL_SERVER_ERROR
            ? 'Something went wrong. Please try again.'
            : errorMessage;

    return {
        success: false,
        error: publicMessage,
        timestamp: new Date().toISOString(),
    };
};

const createPaginatedResponse = <T>(
    data: T[],
    page: string | number,
    limit: string | number,
    total: number,
) => {
    const pageNum = Number(page);
    const limitNum = Number(limit);
    return {
        success: true,
        data,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum),
        },
        timestamp: new Date().toISOString(),
    };
};

const createValidationErrorResponse = (errors: unknown) => {
    return {
        success: false,
        error: 'Validation Error',
        details: Array.isArray(errors) ? errors : [errors],
        timestamp: new Date().toISOString(),
    };
};

const createNotFoundResponse = (resource = 'Resource') => {
    return {
        success: false,
        error: `${resource} not found`,
        timestamp: new Date().toISOString(),
    };
};

const createUnauthorizedResponse = (message = 'Unauthorized') => {
    return {
        success: false,
        error: message,
        timestamp: new Date().toISOString(),
    };
};

const sendSuccessResponse = <T>(
    res: Response,
    statusCode = STATUS_CODES.OK,
    message = 'Success',
    data: T | null = null,
) => {
    const response: Record<string, unknown> = {
        success: true,
        message: message,
        timestamp: new Date().toISOString(),
    };

    if (data !== null) {
        response.data = data;
    }

    res.status(statusCode).json(response);
};

const sendErrorResponse = (
    res: Response,
    statusCode = STATUS_CODES.INTERNAL_SERVER_ERROR,
    message = 'Internal server error',
    error: unknown = null,
) => {
    const publicMessage =
        statusCode >= STATUS_CODES.INTERNAL_SERVER_ERROR
            ? 'Something went wrong. Please try again.'
            : message;
    const response: Record<string, unknown> = {
        success: false,
        error: publicMessage,
        timestamp: new Date().toISOString(),
    };

    if (error !== null && statusCode < STATUS_CODES.INTERNAL_SERVER_ERROR) {
        response.details = error;
    }

    res.status(statusCode).json(response);
};

export {
    createSuccessResponse,
    createErrorResponse,
    createPaginatedResponse,
    createValidationErrorResponse,
    createNotFoundResponse,
    createUnauthorizedResponse,
    sendSuccessResponse,
    sendErrorResponse,
};
