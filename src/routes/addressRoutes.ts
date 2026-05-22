import express from 'express';
import addressController from '../controllers/addressController';
import { authenticateToken } from '../middleware/auth';
import { apiRateLimiter } from '../middleware/rateLimiter';
import { methodNotAllowedHandler } from '../middleware/errorHandler';

const router = express.Router();

router.get('/', authenticateToken, apiRateLimiter, addressController.getMyAddresses);
router.post('/', authenticateToken, apiRateLimiter, addressController.addAddress);
router.put('/:id', authenticateToken, apiRateLimiter, addressController.updateAddress);
router.delete('/:id', authenticateToken, apiRateLimiter, addressController.deleteAddress);
router.patch('/:id/set-default', authenticateToken, apiRateLimiter, addressController.setDefault);

router.all('*', methodNotAllowedHandler);

export default router;
