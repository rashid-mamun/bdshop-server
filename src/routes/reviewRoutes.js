const express = require('express');
const reviewController = require('../controllers/reviewController');
const { validateReview, validateReviewUpdate } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');
const { apiRateLimiter } = require('../middleware/rateLimiter');
const { methodNotAllowedHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Public routes
router.get('/', apiRateLimiter, reviewController.getAllReviews);
router.get('/stats/:serviceId', apiRateLimiter, reviewController.getReviewStatistics);
router.get('/:id', apiRateLimiter, reviewController.getReviewById);

// Protected routes (authentication required)
router.post('/', authenticateToken, validateReview, apiRateLimiter, reviewController.createReview);
router.put('/:id', authenticateToken, validateReviewUpdate, apiRateLimiter, reviewController.updateReview);
router.delete('/:id', authenticateToken, apiRateLimiter, reviewController.deleteReview);
router.all('*', methodNotAllowedHandler);

module.exports = router; 