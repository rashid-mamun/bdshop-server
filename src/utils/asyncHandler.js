const { logger } = require('./logger');
const { createErrorResponse } = require('./response');

const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch((error) => {
            logger.error('Async handler error:', {
                error: error.message,
                stack: error.stack,
                url: req.url,
                method: req.method,
                correlationId: req.headers['x-correlation-id']
            });

            const errorResponse = createErrorResponse(error);
            res.status(error.status || 500).json(errorResponse);
        });
    };
};

const createAsyncController = (controllerFunction) => {
    return asyncHandler(async (req, res) => {
        const result = await controllerFunction(req, res);
        return result;
    });
};

module.exports = {
    asyncHandler,
    createAsyncController
}; 