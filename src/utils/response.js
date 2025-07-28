const { STATUS_CODES } = require('../constants/statusCodes');

const createSuccessResponse = (data, message = 'Success', statusCode = STATUS_CODES.OK) => {
    return {
        success: true,
        message,
        data,
        timestamp: new Date().toISOString()
    };
};

const createErrorResponse = (error, statusCode = STATUS_CODES.INTERNAL_SERVER_ERROR) => {
    return {
        success: false,
        error: error.message || error,
        timestamp: new Date().toISOString()
    };
};

const createPaginatedResponse = (data, page, limit, total) => {
    return {
        success: true,
        data,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
        },
        timestamp: new Date().toISOString()
    };
};

const createValidationErrorResponse = (errors) => {
    return {
        success: false,
        error: 'Validation Error',
        details: Array.isArray(errors) ? errors : [errors],
        timestamp: new Date().toISOString()
    };
};

const createNotFoundResponse = (resource = 'Resource') => {
    return {
        success: false,
        error: `${resource} not found`,
        timestamp: new Date().toISOString()
    };
};

const createUnauthorizedResponse = (message = 'Unauthorized') => {
    return {
        success: false,
        error: message,
        timestamp: new Date().toISOString()
    };
};

// Direct response functions for controllers
const sendSuccessResponse = (res, statusCode = STATUS_CODES.OK, message = 'Success', data = null) => {
    const response = {
        success: true,
        message: message,
        timestamp: new Date().toISOString()
    };

    if (data !== null) {
        response.data = data;
    }

    res.status(statusCode).json(response);
};

const sendErrorResponse = (res, statusCode = STATUS_CODES.INTERNAL_SERVER_ERROR, message = 'Internal server error', error = null) => {
    const response = {
        success: false,
        error: message,
        timestamp: new Date().toISOString()
    };

    if (error !== null) {
        response.details = error;
    }

    res.status(statusCode).json(response);
};

module.exports = {
    createSuccessResponse,
    createErrorResponse,
    createPaginatedResponse,
    createValidationErrorResponse,
    createNotFoundResponse,
    createUnauthorizedResponse,
    sendSuccessResponse,
    sendErrorResponse
}; 