import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';
import { createErrorResponse } from './response';
import { getErrorMessage } from './errorHandler';

type AsyncFunction = (req: Request, res: Response, next: NextFunction) => Promise<any>;

const asyncHandler = (fn: AsyncFunction) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch((error: any) => {
            logger.error('Async handler error:', {
                error: getErrorMessage(error),
                stack: error.stack,
                url: req.url,
                method: req.method,
                correlationId: req.headers['x-correlation-id'],
            });

            const errorResponse = createErrorResponse(error);
            res.status(error.status || 500).json(errorResponse);
        });
    };
};

const createAsyncController = (
    controllerFunction: (req: Request, res: Response) => Promise<any>,
) => {
    return asyncHandler(async (req, res) => {
        const result = await controllerFunction(req, res);
        return result;
    });
};

export { asyncHandler, createAsyncController };
