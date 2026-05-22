import express from 'express';
import publicController from '../controllers/publicController';
import { asyncHandler } from '../utils/asyncHandler';

const router = express.Router();

router.get('/blogs', publicController.getAllBlogs);
router.get('/blogs/:id', publicController.getBlogById);
router.get('/team', publicController.getTeamMembers);
router.get('/team/:id', publicController.getTeamMemberById);

import { methodNotAllowedHandler } from '../middleware/errorHandler';
const validPaths = ['/blogs', '/blogs/:id', '/team', '/team/:id'];
validPaths.forEach((path) => {
    router.all(path, methodNotAllowedHandler);
});

export default router;
