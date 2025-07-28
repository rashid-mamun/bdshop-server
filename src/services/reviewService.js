const Review = require('../models/reviews');
const { logger } = require('../utils/logger');

// Single Responsibility: Handle all review-related business logic
const reviewService = {
    // Create a new review
    async createReview(reviewData) {
        try {
            // Check for duplicate review from same user for same service
            const existingReview = await Review.findOne({
                email: reviewData.email,
                serviceId: reviewData.serviceId
            });

            if (existingReview) {
                throw new Error('User has already reviewed this service');
            }

            const review = new Review(reviewData);
            const savedReview = await review.save();

            // Update service average rating if serviceId is provided
            if (reviewData.serviceId) {
                await this.updateServiceAverageRating(reviewData.serviceId);
            }

            logger.info('Review created successfully:', savedReview._id);
            return savedReview;
        } catch (error) {
            logger.error('Error creating review:', error.message);
            throw error;
        }
    },

    // Get review by ID
    async getReviewById(id) {
        try {
            const review = await Review.findById(id).select({ __v: 0 });
            if (!review) {
                throw new Error('Review not found');
            }
            logger.info('Review fetched successfully:', review._id);
            return review;
        } catch (error) {
            logger.error('Error fetching review:', error.message);
            throw error;
        }
    },

    // Get all reviews with pagination and filtering
    async getAllReviews(filters = {}, pagination = {}) {
        try {
            const { page = 1, limit = 10 } = pagination;
            const skip = (page - 1) * limit;

            let query = {};

            // Service ID filter (if serviceId is provided)
            if (filters.serviceId) {
                query.serviceId = filters.serviceId;
            }

            // Email filter
            if (filters.email) {
                query.email = filters.email;
            }

            // Rating filter (map rating to star field)
            if (filters.rating) {
                query.star = parseInt(filters.rating);
            }

            const [reviews, total] = await Promise.all([
                Review.find(query)
                    .select({ __v: 0 })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(limit)),
                Review.countDocuments(query)
            ]);

            logger.info(`Fetched ${reviews.length} reviews`);
            return {
                reviews,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            logger.error('Error fetching reviews:', error.message);
            throw error;
        }
    },

    // Update review
    async updateReview(id, updateData) {
        try {
            const review = await Review.findByIdAndUpdate(
                id,
                updateData,
                { new: true, runValidators: true }
            ).select({ __v: 0 });

            if (!review) {
                throw new Error('Review not found');
            }

            logger.info('Review updated successfully:', review._id);
            return review;
        } catch (error) {
            logger.error('Error updating review:', error.message);
            throw error;
        }
    },

    // Delete review
    async deleteReview(id) {
        try {
            const review = await Review.findByIdAndDelete(id);
            if (!review) {
                throw new Error('Review not found');
            }

            logger.info('Review deleted successfully:', review._id);
            return review;
        } catch (error) {
            logger.error('Error deleting review:', error.message);
            throw error;
        }
    },

    // Get review statistics for a service
    async getReviewStatistics(serviceId) {
        try {
            const reviews = await Review.find({ serviceId });

            if (reviews.length === 0) {
                return {
                    averageRating: 0,
                    totalReviews: 0,
                    ratingDistribution: {
                        1: 0, 2: 0, 3: 0, 4: 0, 5: 0
                    }
                };
            }

            const totalReviews = reviews.length;
            const totalRating = reviews.reduce((sum, review) => sum + review.star, 0);
            const averageRating = Math.round((totalRating / totalReviews) * 10) / 10; // Round to 1 decimal

            // Calculate rating distribution
            const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
            reviews.forEach(review => {
                ratingDistribution[review.star]++;
            });

            logger.info(`Calculated statistics for service ${serviceId}: ${totalReviews} reviews, avg rating: ${averageRating}`);
            return {
                averageRating,
                totalReviews,
                ratingDistribution
            };
        } catch (error) {
            logger.error('Error calculating review statistics:', error.message);
            throw error;
        }
    },

    // Update service average rating (helper method)
    async updateServiceAverageRating(serviceId) {
        try {
            const Service = require('../models/services');
            const reviews = await Review.find({ serviceId });

            if (reviews.length > 0) {
                const totalRating = reviews.reduce((sum, review) => sum + review.star, 0);
                const averageRating = Math.round((totalRating / reviews.length) * 10) / 10;

                await Service.findByIdAndUpdate(serviceId, {
                    averageRating,
                    reviewCount: reviews.length
                }, { new: true });

                logger.info(`Updated service ${serviceId} average rating to ${averageRating}`);
            }
        } catch (error) {
            logger.error('Error updating service average rating:', error.message);
            // Don't throw error as this is a side effect
        }
    }
};

module.exports = reviewService; 