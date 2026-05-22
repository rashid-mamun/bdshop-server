const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const appModule = require('../../src/app');
const app = appModule.default || appModule;
const reviewModule = require('../../src/models/reviews');
const Review = reviewModule.default || reviewModule.Review || reviewModule;
const userModule = require('../../src/models/user');
const User = userModule.default || userModule.User || userModule;
const serviceModule = require('../../src/models/services');
const Service = serviceModule.default || serviceModule.Service || serviceModule;
const { STATUS_CODES } = require('../../src/constants/statusCodes');
const { SUCCESS_MESSAGES, ERROR_MESSAGES } = require('../../src/constants/messages');

const TEST_JWT_SECRET = 'test-secret-key';

describe('Review Endpoints', () => {
    let testReview;
    let testUser;
    let testService;
    let authToken;

    beforeEach(async () => {
        await Review.deleteMany({});
        await User.deleteMany({});
        await Service.deleteMany({});

        // Create test user
        testUser = new User({
            email: 'test@example.com',
            displayName: 'Test User',
            password: 'password123',
            district: 'Dhaka',
            division: 'Dhaka',
            role: 'user',
        });
        await testUser.save();

        // Generate JWT token for test user
        authToken = jwt.sign(
            { id: testUser._id, email: testUser.email, role: testUser.role },
            TEST_JWT_SECRET,
            { expiresIn: '1h' },
        );

        // Create test service
        testService = new Service({
            name: 'Test Service',
            model: 'Test Model',
            img: 'test-image.jpg',
            price: 1000,
            description: 'Test service description',
            config: 'Test configuration',
            category: 'electronics',
            madeIn: 'Bangladesh',
        });
        await testService.save();

        // Create test review (all required fields)
        testReview = new Review({
            name: testUser.displayName,
            email: testUser.email,
            serviceId: testService._id,
            title: 'Great Service',
            img: testService.img,
            description: 'Great service! Highly recommended.',
            star: 4,
            date: new Date(),
        });
        await testReview.save();
    });

    afterEach(async () => {
        await Review.deleteMany({});
        await User.deleteMany({});
        await Service.deleteMany({});
    });

    describe('POST /api/reviews', () => {
        it('should create new review successfully', async () => {
            const reviewData = {
                name: testUser.displayName,
                email: testUser.email,
                serviceId: new mongoose.Types.ObjectId(), // Use a different serviceId
                title: 'Excellent Service Quality',
                img: testService.img,
                description: 'Excellent service quality!',
                star: 5,
                date: new Date(),
            };

            const response = await request(app)
                .post('/api/reviews')
                .set('Authorization', `Bearer ${authToken}`)
                .send(reviewData)
                .expect(STATUS_CODES.CREATED);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe(SUCCESS_MESSAGES.REVIEW_CREATED);
            expect(response.body.data.name).toBe(reviewData.name);
            expect(response.body.data.star).toBe(reviewData.star);
            expect(response.body.data.description).toBe(reviewData.description);
        });

        it('should return 400 for missing required fields', async () => {
            const reviewData = {
                email: testUser.email,
                title: 'Great Service',
                // Missing name, img, star (required fields)
                description: 'Great service! Highly recommended.',
            };

            const response = await request(app)
                .post('/api/reviews')
                .set('Authorization', `Bearer ${authToken}`)
                .send(reviewData)
                .expect(STATUS_CODES.BAD_REQUEST);

            expect(response.body.success).toBe(false);
        });

        it('should return 400 for invalid rating', async () => {
            const reviewData = {
                name: testUser.displayName,
                email: testUser.email,
                title: 'Great Service',
                img: testService.img,
                description: 'Great service! Highly recommended.',
                star: 6, // Invalid rating (should be 1-5)
                date: new Date(),
            };

            const response = await request(app)
                .post('/api/reviews')
                .set('Authorization', `Bearer ${authToken}`)
                .send(reviewData)
                .expect(STATUS_CODES.BAD_REQUEST);

            expect(response.body.success).toBe(false);
        });

        it('should return 400 for rating below minimum', async () => {
            const reviewData = {
                name: testUser.displayName,
                email: testUser.email,
                title: 'Great Service',
                img: testService.img,
                description: 'Great service! Highly recommended.',
                star: 0, // Invalid rating (should be 1-5)
                date: new Date(),
            };

            const response = await request(app)
                .post('/api/reviews')
                .set('Authorization', `Bearer ${authToken}`)
                .send(reviewData)
                .expect(STATUS_CODES.BAD_REQUEST);

            expect(response.body.success).toBe(false);
        });

        it('should return 400 for missing comment', async () => {
            const reviewData = {
                name: testUser.displayName,
                email: testUser.email,
                img: testService.img,
                star: 4,
                // Missing title (required field)
            };

            const response = await request(app)
                .post('/api/reviews')
                .set('Authorization', `Bearer ${authToken}`)
                .send(reviewData)
                .expect(STATUS_CODES.BAD_REQUEST);

            expect(response.body.success).toBe(false);
        });

        it('should return 401 without authentication', async () => {
            const reviewData = {
                name: testUser.displayName,
                email: testUser.email,
                title: 'Great Service',
                img: testService.img,
                description: 'Great service! Highly recommended.',
                star: 4,
                date: new Date(),
            };

            const response = await request(app)
                .post('/api/reviews')
                .send(reviewData)
                .expect(STATUS_CODES.UNAUTHORIZED);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/reviews', () => {
        it('should get all reviews with pagination', async () => {
            const response = await request(app)
                .get('/api/reviews?page=1&limit=10')
                .expect(STATUS_CODES.OK);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe(SUCCESS_MESSAGES.REVIEWS_FETCHED);
            expect(response.body.data).toHaveProperty('reviews');
            expect(response.body.data).toHaveProperty('pagination');
            expect(Array.isArray(response.body.data.reviews)).toBe(true);
        });

        it('should filter reviews by service ID', async () => {
            const response = await request(app)
                .get(`/api/reviews?serviceId=${testService._id}`)
                .expect(STATUS_CODES.OK);

            expect(response.body.success).toBe(true);
            expect(
                response.body.data.reviews.every(
                    (review) => review.serviceId === testService._id.toString(),
                ),
            ).toBe(true);
        });

        it('should filter reviews by email', async () => {
            const response = await request(app)
                .get(`/api/reviews?email=${testUser.email}`)
                .expect(STATUS_CODES.OK);

            expect(response.body.success).toBe(true);
            expect(response.body.data.reviews).toHaveLength(1);
            expect(response.body.data.reviews[0].serviceId).toBe(testService._id.toString());
            expect(response.body.data.reviews[0]).not.toHaveProperty('email');
        });

        it('should filter reviews by rating', async () => {
            const response = await request(app)
                .get('/api/reviews?rating=4')
                .expect(STATUS_CODES.OK);

            expect(response.body.success).toBe(true);
            expect(response.body.data.reviews.every((review) => review.rating === 4)).toBe(true);
        });

        it('should handle pagination parameters', async () => {
            const response = await request(app)
                .get('/api/reviews?page=1&limit=5')
                .expect(STATUS_CODES.OK);

            expect(response.body.success).toBe(true);
            expect(response.body.data.pagination.page).toBe(1);
            expect(response.body.data.pagination.limit).toBe(5);
            expect(response.body.data.reviews.length).toBeLessThanOrEqual(5);
        });

        it('should return empty results for non-existent service', async () => {
            const fakeServiceId = new mongoose.Types.ObjectId();
            const response = await request(app)
                .get(`/api/reviews?serviceId=${fakeServiceId}`)
                .expect(STATUS_CODES.OK);

            expect(response.body.success).toBe(true);
            expect(response.body.data.reviews).toHaveLength(0);
        });
    });

    describe('GET /api/reviews/my-reviews', () => {
        it('should return current user reviews', async () => {
            const response = await request(app)
                .get('/api/reviews/my-reviews')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(STATUS_CODES.OK);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('reviews');
            expect(
                response.body.data.reviews.every((review) => review.email === testUser.email),
            ).toBe(true);
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .get('/api/reviews/my-reviews')
                .expect(STATUS_CODES.UNAUTHORIZED);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/reviews/:id', () => {
        it('should get review by ID successfully', async () => {
            const response = await request(app)
                .get(`/api/reviews/${testReview._id}`)
                .expect(STATUS_CODES.OK);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe(SUCCESS_MESSAGES.REVIEW_FETCHED);
            expect(response.body.data._id).toBe(testReview._id.toString());
            expect(response.body.data).not.toHaveProperty('email');
            expect(response.body.data.star).toBe(testReview.star);
        });

        it('should return 404 for non-existent review', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const response = await request(app)
                .get(`/api/reviews/${fakeId}`)
                .expect(STATUS_CODES.NOT_FOUND);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe(ERROR_MESSAGES.REVIEW_NOT_FOUND);
        });

        it('should return 400 for invalid ID format', async () => {
            const response = await request(app)
                .get('/api/reviews/invalid-id')
                .expect(STATUS_CODES.BAD_REQUEST);

            expect(response.body.success).toBe(false);
        });
    });

    describe('PUT /api/reviews/:id', () => {
        it('should update review successfully', async () => {
            const updateData = {
                star: 5,
                description: 'Updated comment - even better service!',
            };

            const response = await request(app)
                .put(`/api/reviews/${testReview._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(STATUS_CODES.OK);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe(SUCCESS_MESSAGES.REVIEW_UPDATED);
            expect(response.body.data.star).toBe(updateData.star);
            expect(response.body.data.description).toBe(updateData.description);
        });

        it('should return 404 for non-existent review', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const updateData = {
                star: 5,
                description: 'Updated comment',
            };

            const response = await request(app)
                .put(`/api/reviews/${fakeId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(STATUS_CODES.NOT_FOUND);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe(ERROR_MESSAGES.REVIEW_NOT_FOUND);
        });

        it('should return 400 for invalid rating in update', async () => {
            const updateData = {
                star: 6, // Invalid rating
                description: 'Updated comment',
            };

            const response = await request(app)
                .put(`/api/reviews/${testReview._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(STATUS_CODES.BAD_REQUEST);

            expect(response.body.success).toBe(false);
        });

        it('should return 401 without authentication', async () => {
            const updateData = {
                star: 5,
                description: 'Updated comment',
            };

            const response = await request(app)
                .put(`/api/reviews/${testReview._id}`)
                .send(updateData)
                .expect(STATUS_CODES.UNAUTHORIZED);

            expect(response.body.success).toBe(false);
        });
    });

    describe('DELETE /api/reviews/:id', () => {
        it('should delete review successfully', async () => {
            const reviewToDelete = new Review({
                name: testUser.displayName,
                email: testUser.email,
                serviceId: new mongoose.Types.ObjectId(), // Use a different serviceId
                title: 'Review to be deleted',
                img: testService.img,
                description: 'Review to be deleted',
                star: 3,
            });
            await reviewToDelete.save();

            const response = await request(app)
                .delete(`/api/reviews/${reviewToDelete._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(STATUS_CODES.OK);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe(SUCCESS_MESSAGES.REVIEW_DELETED);
        });

        it('should return 404 for non-existent review', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const response = await request(app)
                .delete(`/api/reviews/${fakeId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(STATUS_CODES.NOT_FOUND);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe(ERROR_MESSAGES.REVIEW_NOT_FOUND);
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .delete(`/api/reviews/${testReview._id}`)
                .expect(STATUS_CODES.UNAUTHORIZED);

            expect(response.body.success).toBe(false);
        });
    });

    describe('Review Statistics', () => {
        beforeEach(async () => {
            // Create multiple reviews for statistics testing
            await Review.deleteMany({});

            const reviews = [
                new Review({
                    name: 'User 1',
                    email: 'user1@example.com',
                    serviceId: testService._id,
                    title: 'Excellent Service Review',
                    img: testService.img,
                    description: 'Excellent service',
                    star: 5,
                }),
                new Review({
                    name: 'User 2',
                    email: 'user2@example.com',
                    serviceId: testService._id,
                    title: 'Very Good Service Review',
                    img: testService.img,
                    description: 'Very good service',
                    star: 4,
                }),
                new Review({
                    name: 'User 3',
                    email: 'user3@example.com',
                    serviceId: testService._id,
                    title: 'Good Service Review',
                    img: testService.img,
                    description: 'Good service',
                    star: 3,
                }),
            ];
            await Review.insertMany(reviews);
        });

        it('should get review statistics for a service', async () => {
            const response = await request(app)
                .get(`/api/reviews/stats/${testService._id}`)
                .expect(STATUS_CODES.OK);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('averageRating');
            expect(response.body.data).toHaveProperty('totalReviews');
            expect(response.body.data).toHaveProperty('ratingDistribution');

            // Verify calculations
            expect(response.body.data.totalReviews).toBe(3);
            expect(response.body.data.averageRating).toBe(4); // (5+4+3)/3 = 4
        });

        it('should return zero statistics for service with no reviews', async () => {
            const newService = new Service({
                name: 'New Service',
                model: 'New Model',
                img: 'new-image.jpg',
                price: 2000,
                description: 'New service description',
                config: 'New configuration',
                category: 'electronics',
                madeIn: 'Bangladesh',
            });
            await newService.save();

            const response = await request(app)
                .get(`/api/reviews/stats/${newService._id}`)
                .expect(STATUS_CODES.OK);

            expect(response.body.success).toBe(true);
            expect(response.body.data.totalReviews).toBe(0);
            expect(response.body.data.averageRating).toBe(0);
        });
    });

    describe('Review Validation', () => {
        it('should validate email format', async () => {
            const reviewData = {
                email: 'invalid-email',
                serviceId: testService._id,
                rating: 4,
                comment: 'Test comment',
                userName: testUser.displayName,
            };

            const response = await request(app)
                .post('/api/reviews')
                .set('Authorization', `Bearer ${authToken}`)
                .send(reviewData)
                .expect(STATUS_CODES.BAD_REQUEST);

            expect(response.body.success).toBe(false);
        });

        it('should validate serviceId format', async () => {
            const reviewData = {
                email: testUser.email,
                serviceId: 'invalid-id',
                rating: 4,
                comment: 'Test comment',
                userName: testUser.displayName,
            };

            const response = await request(app)
                .post('/api/reviews')
                .set('Authorization', `Bearer ${authToken}`)
                .send(reviewData)
                .expect(STATUS_CODES.BAD_REQUEST);

            expect(response.body.success).toBe(false);
        });

        it('should validate comment length', async () => {
            const reviewData = {
                email: testUser.email,
                serviceId: testService._id,
                rating: 4,
                comment: 'A', // Too short
                userName: testUser.displayName,
            };

            const response = await request(app)
                .post('/api/reviews')
                .set('Authorization', `Bearer ${authToken}`)
                .send(reviewData)
                .expect(STATUS_CODES.BAD_REQUEST);

            expect(response.body.success).toBe(false);
        });

        it('should validate rating range', async () => {
            const reviewData = {
                email: testUser.email,
                serviceId: testService._id,
                rating: 7, // Out of range (1-5)
                comment: 'Test comment',
                userName: testUser.displayName,
            };

            const response = await request(app)
                .post('/api/reviews')
                .set('Authorization', `Bearer ${authToken}`)
                .send(reviewData)
                .expect(STATUS_CODES.BAD_REQUEST);

            expect(response.body.success).toBe(false);
        });
    });

    describe('Review Business Logic', () => {
        it('should prevent duplicate reviews from same user for same service', async () => {
            // Clear existing reviews
            await Review.deleteMany({});

            const reviewData = {
                name: testUser.displayName,
                email: testUser.email,
                title: `Review for ${testService.name}`,
                img: testService.img,
                description: 'First review',
                star: 4,
                serviceId: testService._id,
            };

            // Create first review
            await request(app)
                .post('/api/reviews')
                .set('Authorization', `Bearer ${authToken}`)
                .send(reviewData)
                .expect(STATUS_CODES.CREATED);

            // Try to create duplicate review
            const response = await request(app)
                .post('/api/reviews')
                .set('Authorization', `Bearer ${authToken}`)
                .send(reviewData)
                .expect(STATUS_CODES.BAD_REQUEST);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('already reviewed');
        });

        it('should allow multiple reviews from different users for same service', async () => {
            // Clear existing reviews
            await Review.deleteMany({});

            const newUser = new User({
                email: 'newuser@example.com',
                displayName: 'New User',
                password: 'password123',
                district: 'Dhaka',
                division: 'Dhaka',
                role: 'user',
            });
            await newUser.save();
            const newUserToken = jwt.sign(
                { id: newUser._id, email: newUser.email, role: newUser.role },
                TEST_JWT_SECRET,
                { expiresIn: '1h' },
            );

            const reviewData1 = {
                name: testUser.displayName,
                email: testUser.email,
                title: `Review for ${testService.name}`,
                img: testService.img,
                description: 'First user review',
                star: 4,
                serviceId: testService._id,
            };

            const reviewData2 = {
                name: newUser.displayName,
                email: newUser.email,
                title: `Review for ${testService.name}`,
                img: testService.img,
                description: 'Second user review',
                star: 5,
                serviceId: testService._id,
            };

            // Create first review
            await request(app)
                .post('/api/reviews')
                .set('Authorization', `Bearer ${authToken}`)
                .send(reviewData1)
                .expect(STATUS_CODES.CREATED);

            // Create second review from different user
            const response = await request(app)
                .post('/api/reviews')
                .set('Authorization', `Bearer ${newUserToken}`)
                .send(reviewData2)
                .expect(STATUS_CODES.CREATED);

            expect(response.body.success).toBe(true);

            // Verify both reviews exist
            const allReviews = await Review.find({
                email: { $in: [testUser.email, newUser.email] },
            });
            expect(allReviews).toHaveLength(2);
        });

        it('should update service average rating when review is added', async () => {
            // Clear existing reviews
            await Review.deleteMany({});

            const reviewData = {
                name: testUser.displayName,
                email: testUser.email,
                title: `Review for ${testService.name}`,
                img: testService.img,
                description: 'Test review for rating update',
                star: 5,
                serviceId: testService._id,
            };

            // Create review
            await request(app)
                .post('/api/reviews')
                .set('Authorization', `Bearer ${authToken}`)
                .send(reviewData)
                .expect(STATUS_CODES.CREATED);

            // Verify service has updated rating
            const updatedService = await Service.findById(testService._id);
            expect(updatedService.averageRating).toBe(5);
            expect(updatedService.reviewCount).toBe(1);
        });
    });
});
