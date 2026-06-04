import express from 'express';
import publicController from '../controllers/publicController';
import { apiRateLimiter } from '../middleware/rateLimiter';

const router = express.Router();

router.get('/blogs', publicController.getAllBlogs);
router.get('/blogs/:id', publicController.getBlogById);
router.get('/team', publicController.getTeamMembers);
router.get('/team/:id', publicController.getTeamMemberById);
router.post('/newsletter', apiRateLimiter, publicController.subscribeNewsletter);
router.post('/returns', apiRateLimiter, publicController.createReturnRequest);

import { methodNotAllowedHandler } from '../middleware/errorHandler';
const validPaths = ['/blogs', '/blogs/:id', '/team', '/team/:id', '/newsletter', '/returns'];
validPaths.forEach((path) => {
    router.all(path, methodNotAllowedHandler);
});

export default router;
