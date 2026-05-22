import express from 'express';
import cartController from '../controllers/cartController';
import { validateCart, validateCartQuantityUpdate } from '../middleware/validation';
import { authenticateToken, requireOwnership } from '../middleware/auth';
import { apiRateLimiter } from '../middleware/rateLimiter';
import { methodNotAllowedHandler } from '../middleware/errorHandler';

const router = express.Router();

router.post('/', authenticateToken, validateCart, apiRateLimiter, cartController.addToCart);
router.get(
    '/summary/:email',
    authenticateToken,
    requireOwnership('email'),
    apiRateLimiter,
    cartController.getCartSummary,
);
router.delete(
    '/clear/:email',
    authenticateToken,
    requireOwnership('email'),
    apiRateLimiter,
    cartController.clearUserCart,
);
router.get(
    '/:email',
    authenticateToken,
    requireOwnership('email'),
    apiRateLimiter,
    cartController.getUserCart,
);
router.put(
    '/:id',
    authenticateToken,
    validateCartQuantityUpdate,
    apiRateLimiter,
    cartController.updateCartItemQuantity,
);
router.delete('/:id', authenticateToken, apiRateLimiter, cartController.removeFromCart);
router.all('*', methodNotAllowedHandler);

export default router;
