const reviewService = require('../services/reviewService');
const { createSuccessResponse, createErrorResponse } = require('../utils/response');
const { asyncHandler } = require('../utils/asyncHandler');
const { STATUS_CODES } = require('../constants/statusCodes');
const { SUCCESS_MESSAGES, ERROR_MESSAGES } = require('../constants/messages');

// Single Responsibility: Handle HTTP requests and responses for review operations
const reviewController = {
    // Create review endpoint
    createReview: asyncHandler(async (req, res) => {
        const reviewData = req.body;

        try {
            const review = await reviewService.createReview(reviewData);

            res.status(STATUS_CODES.CREATED).json(createSuccessResponse(
                {
                    _id: review._id,
                    name: review.name,
                    email: review.email,
                    serviceId: review.serviceId,
                    title: review.title,
                    img: review.img,
                    description: review.description,
                    star: review.star,
                    date: review.date,
                    createdAt: review.createdAt
                },
                SUCCESS_MESSAGES.REVIEW_CREATED
            ));
        } catch (error) {
            if (error.message === 'User has already reviewed this service') {
                return res.status(STATUS_CODES.BAD_REQUEST).json(createErrorResponse('User has already reviewed this service'));
            }
            if (error.name === 'ValidationError') {
                return res.status(STATUS_CODES.BAD_REQUEST).json(createErrorResponse(error.message));
            }
            throw error;
        }
    }),

    // Get review by ID endpoint
    getReviewById: asyncHandler(async (req, res) => {
        const { id } = req.params;
        try {
            const review = await reviewService.getReviewById(id);
            res.status(STATUS_CODES.OK).json(createSuccessResponse({
                _id: review._id,
                name: review.name,
                email: review.email,
                serviceId: review.serviceId,
                title: review.title,
                img: review.img,
                description: review.description,
                star: review.star,
                rating: review.star, // For backward compatibility
                date: review.date,
                createdAt: review.createdAt
            }, SUCCESS_MESSAGES.REVIEW_FETCHED));
        } catch (error) {
            if (error.name === 'CastError') {
                return res.status(STATUS_CODES.BAD_REQUEST).json(createErrorResponse(ERROR_MESSAGES.INVALID_ID_FORMAT));
            }
            if (error.message === 'Review not found') {
                return res.status(STATUS_CODES.NOT_FOUND).json(createErrorResponse(ERROR_MESSAGES.REVIEW_NOT_FOUND));
            }
            throw error;
        }
    }),

    // Get all reviews endpoint
    getAllReviews: asyncHandler(async (req, res) => {
        const { page, limit, serviceId, email, rating } = req.query;
        const filters = { serviceId, email, rating };
        const pagination = { page, limit };

        const result = await reviewService.getAllReviews(filters, pagination);

        const reviews = result.reviews.map(review => ({
            _id: review._id,
            name: review.name,
            email: review.email,
            serviceId: review.serviceId,
            title: review.title,
            img: review.img,
            description: review.description,
            star: review.star,
            rating: review.star, // For backward compatibility
            date: review.date,
            createdAt: review.createdAt
        }));

        res.status(STATUS_CODES.OK).json({
            success: true,
            message: SUCCESS_MESSAGES.REVIEWS_FETCHED,
            data: {
                reviews,
                pagination: result.pagination
            }
        });
    }),

    // Get review statistics endpoint
    getReviewStatistics: asyncHandler(async (req, res) => {
        try {
            const { serviceId } = req.params;
            const statistics = await reviewService.getReviewStatistics(serviceId);

            res.status(STATUS_CODES.OK).json(createSuccessResponse(statistics, 'Review statistics fetched successfully'));
        } catch (error) {
            if (error.name === 'CastError') {
                return res.status(STATUS_CODES.BAD_REQUEST).json(createErrorResponse(ERROR_MESSAGES.INVALID_ID_FORMAT));
            }
            throw error;
        }
    }),

    // Update review endpoint
    updateReview: asyncHandler(async (req, res) => {
        const { id } = req.params;
        const updateData = req.body;

        try {
            const review = await reviewService.updateReview(id, updateData);
            res.status(STATUS_CODES.OK).json(createSuccessResponse(
                {
                    _id: review._id,
                    name: review.name,
                    email: review.email,
                    serviceId: review.serviceId,
                    title: review.title,
                    img: review.img,
                    description: review.description,
                    star: review.star,
                    rating: review.star, // For backward compatibility
                    date: review.date,
                    createdAt: review.createdAt
                },
                SUCCESS_MESSAGES.REVIEW_UPDATED
            ));
        } catch (error) {
            if (error.name === 'CastError') {
                return res.status(STATUS_CODES.BAD_REQUEST).json(createErrorResponse(ERROR_MESSAGES.INVALID_ID_FORMAT));
            }
            if (error.message === 'Review not found') {
                return res.status(STATUS_CODES.NOT_FOUND).json(createErrorResponse(ERROR_MESSAGES.REVIEW_NOT_FOUND));
            }
            if (error.name === 'ValidationError') {
                return res.status(STATUS_CODES.BAD_REQUEST).json(createErrorResponse(error.message));
            }
            throw error;
        }
    }),

    // Delete review endpoint
    deleteReview: asyncHandler(async (req, res) => {
        const { id } = req.params;

        try {
            await reviewService.deleteReview(id);
            res.status(STATUS_CODES.OK).json(createSuccessResponse(null, SUCCESS_MESSAGES.REVIEW_DELETED));
        } catch (error) {
            if (error.name === 'CastError') {
                return res.status(STATUS_CODES.BAD_REQUEST).json(createErrorResponse(ERROR_MESSAGES.INVALID_ID_FORMAT));
            }
            if (error.message === 'Review not found') {
                return res.status(STATUS_CODES.NOT_FOUND).json(createErrorResponse(ERROR_MESSAGES.REVIEW_NOT_FOUND));
            }
            throw error;
        }
    })
};

module.exports = reviewController; 