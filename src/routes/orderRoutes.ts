import express from 'express';
import orderController from '../controllers/orderController';
import { validateOrder, validateOrderUpdate } from '../middleware/validation';
import { authenticateToken, optionalAuth, requireAdmin } from '../middleware/auth';
import { apiRateLimiter } from '../middleware/rateLimiter';
import { methodNotAllowedHandler } from '../middleware/errorHandler';

const router = express.Router();

router.post('/quote', optionalAuth, apiRateLimiter, orderController.quoteOrder);
router.post('/', optionalAuth, validateOrder, apiRateLimiter, orderController.createOrder);
router.get('/', authenticateToken, requireAdmin, apiRateLimiter, orderController.getAllOrders);
router.get('/my-orders', authenticateToken, apiRateLimiter, orderController.getMyOrders);
router.get('/my-stats', authenticateToken, apiRateLimiter, orderController.getMyStats);
router.get('/track/:id', apiRateLimiter, orderController.trackOrder);
router.get(
    '/stats/summary',
    authenticateToken,
    requireAdmin,
    apiRateLimiter,
    orderController.getOrderStatistics,
);
router.get('/:id', authenticateToken, apiRateLimiter, orderController.getOrderById);
router.put(
    '/:id',
    authenticateToken,
    requireAdmin,
    validateOrderUpdate,
    apiRateLimiter,
    orderController.updateOrderStatus,
);
router.delete('/:id', authenticateToken, requireAdmin, apiRateLimiter, orderController.deleteOrder);
router.all('*', methodNotAllowedHandler);

export default router;
