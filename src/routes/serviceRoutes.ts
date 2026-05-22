import express from 'express';
import serviceController from '../controllers/serviceController';
import {
    validateService,
    validateServiceUpdate,
    validateServiceQuery,
} from '../middleware/validation';
import { createStockNotification } from '../controllers/stockNotificationController';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { apiRateLimiter, searchRateLimiter } from '../middleware/rateLimiter';
import { methodNotAllowedHandler } from '../middleware/errorHandler';

const router = express.Router();

router.get('/', apiRateLimiter, validateServiceQuery, serviceController.getAllServices);
router.get('/search', searchRateLimiter, validateServiceQuery, serviceController.searchServices);
router.get('/categories/all', apiRateLimiter, serviceController.getAllCategories);
router.get(
    '/stats/overview',
    authenticateToken,
    requireAdmin,
    apiRateLimiter,
    serviceController.getServiceStatistics,
);
router.get('/:id', apiRateLimiter, serviceController.getServiceById);
router.post('/:id/notify', apiRateLimiter, createStockNotification);

router.post(
    '/',
    authenticateToken,
    requireAdmin,
    validateService,
    apiRateLimiter,
    serviceController.createService,
);
router.put(
    '/:id',
    authenticateToken,
    requireAdmin,
    validateServiceUpdate,
    apiRateLimiter,
    serviceController.updateService,
);
router.delete(
    '/:id',
    authenticateToken,
    requireAdmin,
    apiRateLimiter,
    serviceController.deleteService,
);

router.all('*', methodNotAllowedHandler);

export default router;
