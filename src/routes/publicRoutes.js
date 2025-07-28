const express = require('express');
const publicController = require('../controllers/publicController');
const { asyncHandler } = require('../utils/asyncHandler');

const router = express.Router();

// Public API endpoints using controller-service pattern
router.get('/blogs', asyncHandler(publicController.getAllBlogs));
router.get('/blogs/:id', asyncHandler(publicController.getBlogById));
router.get('/team', asyncHandler(publicController.getTeamMembers));
router.get('/team/:id', asyncHandler(publicController.getTeamMemberById));

// 405 Method Not Allowed for unsupported HTTP methods on valid public routes
const { methodNotAllowedHandler } = require('../middleware/errorHandler');
const validPaths = ['/blogs', '/blogs/:id', '/team', '/team/:id'];
validPaths.forEach((path) => {
    router.all(path, methodNotAllowedHandler);
});

module.exports = router; 