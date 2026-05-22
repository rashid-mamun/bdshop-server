import express from 'express';
import reviewController from '../controllers/reviewController';
import { validateReview, validateReviewUpdate } from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';
import { apiRateLimiter } from '../middleware/rateLimiter';
import { methodNotAllowedHandler } from '../middleware/errorHandler';

const router = express.Router();

router.get('/', apiRateLimiter, reviewController.getAllReviews);
router.get('/stats/:serviceId', apiRateLimiter, reviewController.getReviewStatistics);

router.get('/my-reviews', authenticateToken, apiRateLimiter, reviewController.getMyReviews);
router.get('/:id', apiRateLimiter, reviewController.getReviewById);

router.post('/', authenticateToken, validateReview, apiRateLimiter, reviewController.createReview);
router.put(
    '/:id',
    authenticateToken,
    validateReviewUpdate,
    apiRateLimiter,
    reviewController.updateReview,
);
router.delete('/:id', authenticateToken, apiRateLimiter, reviewController.deleteReview);
router.all('*', methodNotAllowedHandler);

export default router;
