const publicService = require('../services/publicService');
const { createSuccessResponse, createErrorResponse } = require('../utils/response');
const { asyncHandler } = require('../utils/asyncHandler');

// Single Responsibility: Handle HTTP requests and responses for public content operations
const publicController = {
    // Get all blogs endpoint
    getAllBlogs: asyncHandler(async (req, res) => {
        const { page, limit } = req.query;
        const pagination = { page, limit };

        const result = await publicService.getAllBlogs(pagination);

        res.status(200).json(createSuccessResponse(result.blogs, null, {
            pagination: result.pagination
        }));
    }),

    // Get blog by ID endpoint
    getBlogById: asyncHandler(async (req, res) => {
        const { id } = req.params;
        try {
            const blog = await publicService.getBlogById(id);
            res.status(200).json(createSuccessResponse({
                _id: blog._id,
                title: blog.title,
                content: blog.content,
                author: blog.author,
                createdAt: blog.createdAt
            }));
        } catch (error) {
            if (error.message === 'Blog not found') {
                return res.status(404).json({ success: false, error: 'Blog not found' });
            }
            if (error.name === 'CastError') {
                return res.status(400).json({ success: false, error: 'Invalid blog ID format' });
            }
            res.status(500).json({ success: false, error: error.message });
        }
    }),

    // Get all team members endpoint
    getTeamMembers: asyncHandler(async (req, res) => {
        const teamMembers = await publicService.getTeamMembers();

        res.status(200).json(createSuccessResponse(teamMembers));
    }),

    // Get team member by ID endpoint
    getTeamMemberById: asyncHandler(async (req, res) => {
        const { id } = req.params;
        try {
            const teamMember = await publicService.getTeamMemberById(id);
            res.status(200).json(createSuccessResponse({
                _id: teamMember._id,
                name: teamMember.name,
                position: teamMember.position,
                image: teamMember.image,
                bio: teamMember.bio
            }));
        } catch (error) {
            if (error.message === 'Team member not found') {
                return res.status(404).json({ success: false, error: 'Team member not found' });
            }
            if (error.name === 'CastError') {
                return res.status(400).json({ success: false, error: 'Invalid team member ID format' });
            }
            res.status(500).json({ success: false, error: error.message });
        }
    })
};

module.exports = publicController; 