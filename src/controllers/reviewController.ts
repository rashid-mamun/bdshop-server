import { Request, Response } from 'express';
import reviewService from '../services/reviewService';
import {
    getErrorMessage,
    getErrorName,
    getErrorCode,
    getErrorProperty,
} from '../utils/errorHandler';
import { createSuccessResponse, createErrorResponse } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';
import { STATUS_CODES } from '../constants/statusCodes';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '../constants/messages';
import { USER_ROLES } from '../constants/config';
import Review from '../models/reviews';
import Order from '../models/orders';

type RequestWithUser = Request & {
    user?: {
        id?: string;
        email?: string;
        role?: string;
    };
};

const canAccessReview = (req: RequestWithUser, reviewEmail?: string) => {
    const requester = req.user;
    if (!requester) return false;
    if (requester.role === USER_ROLES.ADMIN || requester.role === USER_ROLES.SUPER_ADMIN)
        return true;
    return Boolean(reviewEmail && requester.email === reviewEmail);
};

const reviewController = {
    createReview: asyncHandler(async (req: Request, res: Response) => {
        const requesterEmail = (req as RequestWithUser).user?.email;
        if (!requesterEmail) {
            return res
                .status(STATUS_CODES.UNAUTHORIZED)
                .json(createErrorResponse(ERROR_MESSAGES.UNAUTHORIZED, STATUS_CODES.UNAUTHORIZED));
        }
        const reviewData = { ...req.body, email: requesterEmail };

        try {
            // Enforce verified purchase: user must have a delivered order with this product
            const deliveredOrder = await Order.findOne({
                email: requesterEmail,
                status: 'delivered',
                'items.serviceId': reviewData.serviceId,
            })
                .select('_id')
                .lean();

            if (!deliveredOrder) {
                return res
                    .status(STATUS_CODES.FORBIDDEN)
                    .json(
                        createErrorResponse(
                            'You can only review products you have purchased and received.',
                            STATUS_CODES.FORBIDDEN,
                        ),
                    );
            }

            // Auto-mark as verified purchase
            reviewData.verifiedPurchase = true;

            const review = await reviewService.createReview(reviewData);

            res.status(STATUS_CODES.CREATED).json(
                createSuccessResponse(
                    {
                        _id: review._id,
                        name: review.name,
                        serviceId: review.serviceId,
                        title: review.title,
                        img: review.img,
                        description: review.description,
                        star: review.star,
                        verifiedPurchase: review.verifiedPurchase,
                        date: review.date,
                        createdAt: review.createdAt,
                    },
                    SUCCESS_MESSAGES.REVIEW_CREATED,
                ),
            );
        } catch (error: any) {
            if (getErrorMessage(error) === 'User has already reviewed this service') {
                return res
                    .status(STATUS_CODES.BAD_REQUEST)
                    .json(
                        createErrorResponse(
                            'User has already reviewed this service',
                            STATUS_CODES.BAD_REQUEST,
                        ),
                    );
            }
            if (getErrorName(error) === 'ValidationError') {
                return res
                    .status(STATUS_CODES.BAD_REQUEST)
                    .json(createErrorResponse(getErrorMessage(error), STATUS_CODES.BAD_REQUEST));
            }
            throw error;
        }
    }),

    canReview: asyncHandler(async (req: Request, res: Response) => {
        const requester = (req as RequestWithUser).user;
        if (!requester?.email) {
            return res
                .status(STATUS_CODES.UNAUTHORIZED)
                .json(createErrorResponse(ERROR_MESSAGES.UNAUTHORIZED, STATUS_CODES.UNAUTHORIZED));
        }
        const { productId } = req.params;

        // Check if user has a delivered order containing this product
        const deliveredOrder = await Order.findOne({
            email: requester.email,
            status: 'delivered',
            'items.serviceId': productId,
        })
            .select('_id')
            .lean();

        // Check if user already reviewed this product
        const existingReview = await Review.findOne({
            email: requester.email,
            serviceId: productId,
        })
            .select('_id')
            .lean();

        res.status(STATUS_CODES.OK).json(
            createSuccessResponse(
                {
                    canReview: !!deliveredOrder && !existingReview,
                    alreadyReviewed: !!existingReview,
                    hasPurchased: !!deliveredOrder,
                },
                'Review eligibility checked',
            ),
        );
    }),

    getReviewById: asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        try {
            const review = await reviewService.getReviewById(id as string);
            res.status(STATUS_CODES.OK).json(
                createSuccessResponse(
                    {
                        _id: review._id,
                        name: review.name,
                        serviceId: review.serviceId,
                        title: review.title,
                        img: review.img,
                        description: review.description,
                        star: review.star,
                        rating: review.star,
                        verifiedPurchase: review.verifiedPurchase,
                        date: review.date,
                        createdAt: review.createdAt,
                    },
                    SUCCESS_MESSAGES.REVIEW_FETCHED,
                ),
            );
        } catch (error: any) {
            if (getErrorName(error) === 'CastError') {
                return res
                    .status(STATUS_CODES.BAD_REQUEST)
                    .json(
                        createErrorResponse(
                            ERROR_MESSAGES.INVALID_ID_FORMAT,
                            STATUS_CODES.BAD_REQUEST,
                        ),
                    );
            }
            if (getErrorMessage(error) === 'Review not found') {
                return res
                    .status(STATUS_CODES.NOT_FOUND)
                    .json(
                        createErrorResponse(
                            ERROR_MESSAGES.REVIEW_NOT_FOUND,
                            STATUS_CODES.NOT_FOUND,
                        ),
                    );
            }
            throw error;
        }
    }),

    getAllReviews: asyncHandler(async (req: Request, res: Response) => {
        const { page, limit, serviceId, email, rating } = req.query as any;
        const filters = { serviceId, email, rating };
        const pagination = { page, limit };

        const result = await reviewService.getAllReviews(filters, pagination);

        const reviews = result.reviews.map((review: any) => ({
            _id: review._id,
            name: review.name,
            serviceId: review.serviceId,
            title: review.title,
            img: review.img,
            description: review.description,
            star: review.star,
            rating: review.star,
            verifiedPurchase: review.verifiedPurchase,
            date: review.date,
            createdAt: review.createdAt,
        }));

        res.status(STATUS_CODES.OK).json({
            success: true,
            message: SUCCESS_MESSAGES.REVIEWS_FETCHED,
            data: {
                reviews,
                pagination: result.pagination,
            },
        });
    }),

    getReviewStatistics: asyncHandler(async (req: Request, res: Response) => {
        try {
            const { serviceId } = req.params;
            const statistics = await reviewService.getReviewStatistics(serviceId as string);

            res.status(STATUS_CODES.OK).json(
                createSuccessResponse(statistics, 'Review statistics fetched successfully'),
            );
        } catch (error: any) {
            if (getErrorName(error) === 'CastError') {
                return res
                    .status(STATUS_CODES.BAD_REQUEST)
                    .json(
                        createErrorResponse(
                            ERROR_MESSAGES.INVALID_ID_FORMAT,
                            STATUS_CODES.BAD_REQUEST,
                        ),
                    );
            }
            throw error;
        }
    }),

    updateReview: asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        const updateData = req.body;

        try {
            const existingReview = await Review.findById(id).select({ email: 1 });
            if (!existingReview) {
                return res
                    .status(STATUS_CODES.NOT_FOUND)
                    .json(
                        createErrorResponse(
                            ERROR_MESSAGES.REVIEW_NOT_FOUND,
                            STATUS_CODES.NOT_FOUND,
                        ),
                    );
            }
            if (!canAccessReview(req as RequestWithUser, existingReview.email)) {
                return res
                    .status(STATUS_CODES.FORBIDDEN)
                    .json(
                        createErrorResponse(
                            ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS,
                            STATUS_CODES.FORBIDDEN,
                        ),
                    );
            }
            const review = await reviewService.updateReview(id as string, updateData);
            res.status(STATUS_CODES.OK).json(
                createSuccessResponse(
                    {
                        _id: review._id,
                        name: review.name,
                        email: review.email,
                        serviceId: review.serviceId,
                        title: review.title,
                        img: review.img,
                        description: review.description,
                        star: review.star,
                        rating: review.star,
                        verifiedPurchase: review.verifiedPurchase,
                        date: review.date,
                        createdAt: review.createdAt,
                    },
                    SUCCESS_MESSAGES.REVIEW_UPDATED,
                ),
            );
        } catch (error: any) {
            if (getErrorName(error) === 'CastError') {
                return res
                    .status(STATUS_CODES.BAD_REQUEST)
                    .json(
                        createErrorResponse(
                            ERROR_MESSAGES.INVALID_ID_FORMAT,
                            STATUS_CODES.BAD_REQUEST,
                        ),
                    );
            }
            if (getErrorMessage(error) === 'Review not found') {
                return res
                    .status(STATUS_CODES.NOT_FOUND)
                    .json(
                        createErrorResponse(
                            ERROR_MESSAGES.REVIEW_NOT_FOUND,
                            STATUS_CODES.NOT_FOUND,
                        ),
                    );
            }
            if (getErrorName(error) === 'ValidationError') {
                return res
                    .status(STATUS_CODES.BAD_REQUEST)
                    .json(createErrorResponse(getErrorMessage(error), STATUS_CODES.BAD_REQUEST));
            }
            throw error;
        }
    }),

    deleteReview: asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;

        try {
            const existingReview = await Review.findById(id).select({ email: 1 });
            if (!existingReview) {
                return res
                    .status(STATUS_CODES.NOT_FOUND)
                    .json(
                        createErrorResponse(
                            ERROR_MESSAGES.REVIEW_NOT_FOUND,
                            STATUS_CODES.NOT_FOUND,
                        ),
                    );
            }
            if (!canAccessReview(req as RequestWithUser, existingReview.email)) {
                return res
                    .status(STATUS_CODES.FORBIDDEN)
                    .json(
                        createErrorResponse(
                            ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS,
                            STATUS_CODES.FORBIDDEN,
                        ),
                    );
            }
            await reviewService.deleteReview(id as string);
            res.status(STATUS_CODES.OK).json(
                createSuccessResponse(null, SUCCESS_MESSAGES.REVIEW_DELETED),
            );
        } catch (error: any) {
            if (getErrorName(error) === 'CastError') {
                return res
                    .status(STATUS_CODES.BAD_REQUEST)
                    .json(
                        createErrorResponse(
                            ERROR_MESSAGES.INVALID_ID_FORMAT,
                            STATUS_CODES.BAD_REQUEST,
                        ),
                    );
            }
            if (getErrorMessage(error) === 'Review not found') {
                return res
                    .status(STATUS_CODES.NOT_FOUND)
                    .json(
                        createErrorResponse(
                            ERROR_MESSAGES.REVIEW_NOT_FOUND,
                            STATUS_CODES.NOT_FOUND,
                        ),
                    );
            }
            throw error;
        }
    }),

    getMyReviews: asyncHandler(async (req: Request, res: Response) => {
        const { page, limit } = req.query as any;
        const filters = { email: (req as any).user.email };
        const result = await reviewService.getAllReviews(filters as any, { page, limit });
        res.status(STATUS_CODES.OK).json({
            success: true,
            message: 'Reviews fetched successfully',
            data: result,
        });
    }),
};

export default reviewController;
