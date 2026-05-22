import express from 'express';
import { authController } from '../controllers/authController';
import { authRateLimiter } from '../middleware/rateLimiter';
import { methodNotAllowedHandler } from '../middleware/errorHandler';

const router = express.Router();

router.post('/google', authRateLimiter, authController.googleLogin);
router.post('/facebook', authRateLimiter, authController.facebookLogin);

router.all('*', methodNotAllowedHandler);

export default router;
