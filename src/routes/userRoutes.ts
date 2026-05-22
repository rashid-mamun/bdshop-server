import express from 'express';
import userController from '../controllers/userController';
import { validateUser, validateUserUpdate, validateProfileUpdate } from '../middleware/validation';
import { authenticateToken, requireAdmin, requireOwnership } from '../middleware/auth';
import { apiRateLimiter } from '../middleware/rateLimiter';
import { methodNotAllowedHandler } from '../middleware/errorHandler';

const router = express.Router();

router.post('/register', validateUser, apiRateLimiter, userController.createUser);
router.post('/login', apiRateLimiter, userController.login);
router.post('/logout', apiRateLimiter, userController.logout);
router.post('/refresh', apiRateLimiter, userController.refreshToken);
router.get('/:email', authenticateToken, requireOwnership('email'), apiRateLimiter, userController.getUserByEmail);

router.get('/', authenticateToken, requireAdmin, apiRateLimiter, userController.getAllUsers);
router.put(
    '/',
    authenticateToken,
    validateUserUpdate,
    requireOwnership('email'),
    apiRateLimiter,
    userController.updateUser,
);
router.put('/admin', authenticateToken, requireAdmin, apiRateLimiter, userController.makeUserAdmin);
router.delete(
    '/:email',
    authenticateToken,
    requireAdmin,
    apiRateLimiter,
    userController.deleteUser,
);

router.get('/profile/me', authenticateToken, apiRateLimiter, userController.getProfile);
router.put(
    '/profile/me',
    authenticateToken,
    validateProfileUpdate,
    apiRateLimiter,
    userController.updateProfile,
);
router.put('/change-password', authenticateToken, apiRateLimiter, userController.changePassword);

router.put(
    '/:email/deactivate',
    authenticateToken,
    requireAdmin,
    apiRateLimiter,
    userController.deactivateUser,
);
router.put(
    '/:email/reactivate',
    authenticateToken,
    requireAdmin,
    apiRateLimiter,
    userController.reactivateUser,
);

router.all('*', methodNotAllowedHandler);

export default router;
