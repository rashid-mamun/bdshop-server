const express = require('express');
const serviceController = require('../controllers/serviceController');
const { validateService, validateServiceUpdate } = require('../middleware/validation');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { apiRateLimiter } = require('../middleware/rateLimiter');
const { methodNotAllowedHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Public routes
router.get('/', apiRateLimiter, serviceController.getAllServices);
router.get('/search', apiRateLimiter, serviceController.searchServices);
router.get('/categories/all', apiRateLimiter, serviceController.getAllCategories);
router.get('/stats/overview', authenticateToken, requireAdmin, apiRateLimiter, serviceController.getServiceStatistics);
router.get('/:id', apiRateLimiter, serviceController.getServiceById);

// Protected routes (admin authentication required)
router.post('/', authenticateToken, requireAdmin, validateService, apiRateLimiter, serviceController.createService);
router.put('/:id', authenticateToken, requireAdmin, validateServiceUpdate, apiRateLimiter, serviceController.updateService);
router.delete('/:id', authenticateToken, requireAdmin, apiRateLimiter, serviceController.deleteService);

router.all('*', methodNotAllowedHandler);

module.exports = router; 