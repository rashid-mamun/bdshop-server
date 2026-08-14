import express from 'express';
import userController from '../controllers/userController';
import { validateUser, validateUserUpdate, validateProfileUpdate } from '../middleware/validation';
import { authenticateToken, requireAdmin, requireOwnership } from '../middleware/auth';
import { apiRateLimiter, authRateLimiter } from '../middleware/rateLimiter';
import { methodNotAllowedHandler } from '../middleware/errorHandler';

const router = express.Router();

router.post('/register', authRateLimiter, validateUser, userController.createUser);
router.post('/login', authRateLimiter, userController.login);
router.post('/logout', apiRateLimiter, userController.logout);
router.post('/refresh', authRateLimiter, userController.refreshToken);
router.post('/password-reset/request', authRateLimiter, userController.requestPasswordReset);
router.post('/password-reset/confirm', authRateLimiter, userController.resetPassword);
router.get(
    '/:email',
    authenticateToken,
    requireOwnership('email'),
    apiRateLimiter,
    userController.getUserByEmail,
);

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
router.put('/role', authenticateToken, requireAdmin, apiRateLimiter, userController.updateUserRole);
router.put(
    '/:email/role',
    authenticateToken,
    requireAdmin,
    apiRateLimiter,
    userController.updateUserRole,
);
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
