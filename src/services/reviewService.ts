import Review from '../models/reviews';
import {
    getErrorMessage,
    getErrorName,
    getErrorCode,
    getErrorProperty,
} from '../utils/errorHandler';
import Service from '../models/services';
import { IReview } from '../types';
import { logger } from '../utils/logger';
import { APP_CONFIG } from '../constants/config';

type ReviewFilters = {
    serviceId?: string;
    email?: string;
    rating?: string | number;
};

type PaginationOptions = {
    page?: string | number;
    limit?: string | number;
};

const reviewService = {
    async createReview(reviewData: Partial<IReview>) {
        try {
            const existingReview = await Review.findOne({
                email: reviewData.email,
                serviceId: reviewData.serviceId,
            });

            if (existingReview) {
                throw new Error('User has already reviewed this service');
            }

            const review = new Review(reviewData);
            const savedReview = await review.save();

            if (reviewData.serviceId) {
                await this.updateServiceAverageRating(reviewData.serviceId.toString());
            }

            logger.info('Review created successfully:', savedReview._id);
            return savedReview;
        } catch (error: any) {
            logger.error('Error creating review:', getErrorMessage(error));
            throw error;
        }
    },

    async getReviewById(id: string) {
        try {
            const review = await Review.findById(id).select({ __v: 0 });
            if (!review) {
                throw new Error('Review not found');
            }
            logger.info('Review fetched successfully:', review._id);
            return review;
        } catch (error: any) {
            logger.error('Error fetching review:', getErrorMessage(error));
            throw error;
        }
    },

    async getAllReviews(filters: ReviewFilters = {}, pagination: PaginationOptions = {}) {
        try {
            const requestedPage = Number(pagination.page ?? 1);
            const requestedLimit = Number(pagination.limit ?? APP_CONFIG.DEFAULT_LIMIT);
            const currentPage = Math.max(1, Number.isFinite(requestedPage) ? requestedPage : 1);
            const pageSize = Math.min(
                APP_CONFIG.MAX_PAGE_SIZE,
                Math.max(
                    1,
                    Number.isFinite(requestedLimit) ? requestedLimit : APP_CONFIG.DEFAULT_LIMIT,
                ),
            );
            const skip = (currentPage - 1) * pageSize;

            const query: any = {};

            if (filters.serviceId) {
                query.serviceId = filters.serviceId;
            }

            if (filters.email) {
                query.email = filters.email;
            }

            if (filters.rating !== undefined) {
                query.star = Number(filters.rating);
            }

            const [reviews, total] = await Promise.all([
                Review.find(query)
                    .select({ __v: 0 })
                    .populate('serviceId', 'model name img category')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(pageSize),
                Review.countDocuments(query),
            ]);

            logger.info(`Fetched ${reviews.length} reviews`);
            return {
                reviews,
                pagination: {
                    page: currentPage,
                    limit: pageSize,
                    total,
                    pages: Math.ceil(total / pageSize),
                },
            };
        } catch (error: any) {
            logger.error('Error fetching reviews:', getErrorMessage(error));
            throw error;
        }
    },

    async updateReview(id: string, updateData: Partial<IReview>) {
        try {
            const existingReview = await Review.findById(id).select({ serviceId: 1 });
            const review = await Review.findByIdAndUpdate(id, updateData, {
                new: true,
                runValidators: true,
            }).select({ __v: 0 });

            if (!review) {
                throw new Error('Review not found');
            }

            const serviceId = review.serviceId || existingReview?.serviceId;
            if (serviceId) {
                await this.updateServiceAverageRating(serviceId.toString());
            }

            logger.info('Review updated successfully:', review._id);
            return review;
        } catch (error: any) {
            logger.error('Error updating review:', getErrorMessage(error));
            throw error;
        }
    },

    async deleteReview(id: string) {
        try {
            const review = await Review.findByIdAndDelete(id);
            if (!review) {
                throw new Error('Review not found');
            }

            if (review.serviceId) {
                await this.updateServiceAverageRating(review.serviceId.toString());
            }

            logger.info('Review deleted successfully:', review._id);
            return review;
        } catch (error: any) {
            logger.error('Error deleting review:', getErrorMessage(error));
            throw error;
        }
    },

    async getReviewStatistics(serviceId: string) {
        try {
            const reviews = await Review.find({ serviceId });

            if (reviews.length === 0) {
                return {
                    averageRating: 0,
                    totalReviews: 0,
                    ratingDistribution: {
                        1: 0,
                        2: 0,
                        3: 0,
                        4: 0,
                        5: 0,
                    },
                };
            }

            const totalReviews = reviews.length;
            const totalRating = reviews.reduce((sum, review) => sum + review.star, 0);
            const averageRating = Math.round((totalRating / totalReviews) * 10) / 10;

            const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
            reviews.forEach((review) => {
                (ratingDistribution as any)[review.star]++;
            });

            logger.info(
                `Calculated statistics for service ${serviceId}: ${totalReviews} reviews, avg rating: ${averageRating}`,
            );
            return {
                averageRating,
                totalReviews,
                ratingDistribution,
            };
        } catch (error: any) {
            logger.error('Error calculating review statistics:', getErrorMessage(error));
            throw error;
        }
    },

    async updateServiceAverageRating(serviceId: string) {
        try {
            const reviews = await Review.find({ serviceId });

            const totalRating = reviews.reduce((sum, review) => sum + review.star, 0);
            const averageRating =
                reviews.length > 0 ? Math.round((totalRating / reviews.length) * 10) / 10 : 0;

            await Service.findByIdAndUpdate(
                serviceId,
                {
                    averageRating,
                    reviewCount: reviews.length,
                },
                { new: true },
            );

            logger.info(`Updated service ${serviceId} average rating to ${averageRating}`);
        } catch (error: any) {
            logger.error('Error updating service average rating:', getErrorMessage(error));
        }
    },
};

export default reviewService;
