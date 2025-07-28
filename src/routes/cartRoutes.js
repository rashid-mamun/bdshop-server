const express = require('express');
const cartController = require('../controllers/cartController');
const { validateCart, validateCartQuantityUpdate } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');
const { apiRateLimiter } = require('../middleware/rateLimiter');
const { methodNotAllowedHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Protected routes (authentication required)
router.post('/', authenticateToken, validateCart, apiRateLimiter, cartController.addToCart);
router.get('/:email', authenticateToken, apiRateLimiter, cartController.getUserCart);
router.put('/:id', authenticateToken, validateCartQuantityUpdate, apiRateLimiter, cartController.updateCartItemQuantity);
router.delete('/:id', authenticateToken, apiRateLimiter, cartController.removeFromCart);
router.delete('/clear/:email', authenticateToken, apiRateLimiter, cartController.clearUserCart);
router.get('/summary/:email', authenticateToken, apiRateLimiter, cartController.getCartSummary);
router.all('*', methodNotAllowedHandler);

module.exports = router; 