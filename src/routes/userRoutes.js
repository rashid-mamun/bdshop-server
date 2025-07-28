const express = require('express');
const userController = require('../controllers/userController');
const { validateUser, validateUserUpdate, validateProfileUpdate } = require('../middleware/validation');
const { authenticateToken, requireAdmin, requireOwnership } = require('../middleware/auth');
const { apiRateLimiter } = require('../middleware/rateLimiter');
const { methodNotAllowedHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Public routes
router.post('/', validateUser, apiRateLimiter, userController.createUser);
router.get('/:email', apiRateLimiter, userController.getUserByEmail);

// Protected routes (authentication required)
router.get('/', authenticateToken, requireAdmin, apiRateLimiter, userController.getAllUsers);
router.put('/', authenticateToken, validateUserUpdate, apiRateLimiter, userController.updateUser);
router.put('/admin', authenticateToken, requireAdmin, apiRateLimiter, userController.makeUserAdmin);
router.delete('/:email', authenticateToken, requireAdmin, apiRateLimiter, userController.deleteUser);

// Profile routes (authentication required)
router.get('/profile/me', authenticateToken, apiRateLimiter, userController.getProfile);
router.put('/profile/me', authenticateToken, validateProfileUpdate, apiRateLimiter, userController.updateProfile);

// User management routes (admin only)
router.put('/:email/deactivate', authenticateToken, requireAdmin, apiRateLimiter, userController.deactivateUser);
router.put('/:email/reactivate', authenticateToken, requireAdmin, apiRateLimiter, userController.reactivateUser);

router.all('*', methodNotAllowedHandler);

module.exports = router; 