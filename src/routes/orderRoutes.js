const express = require('express');
const orderController = require('../controllers/orderController');
const { validateOrder, validateOrderUpdate } = require('../middleware/validation');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { apiRateLimiter } = require('../middleware/rateLimiter');
const { methodNotAllowedHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Protected routes (authentication required)
router.post('/', authenticateToken, validateOrder, apiRateLimiter, orderController.createOrder);
router.get('/', authenticateToken, apiRateLimiter, orderController.getAllOrders);
router.get('/:id', authenticateToken, apiRateLimiter, orderController.getOrderById);
router.put('/:id', authenticateToken, validateOrderUpdate, apiRateLimiter, orderController.updateOrderStatus);
router.delete('/:id', authenticateToken, requireAdmin, apiRateLimiter, orderController.deleteOrder);
router.get('/stats/summary', authenticateToken, requireAdmin, apiRateLimiter, orderController.getOrderStatistics);
router.all('*', methodNotAllowedHandler);

module.exports = router; 