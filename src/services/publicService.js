const Blog = require('../models/blogs');
const TeamMember = require('../models/ourTeams');
const { logger } = require('../utils/logger');

// Single Responsibility: Handle all public content-related business logic
const publicService = {
    // Get all blogs with pagination
    async getAllBlogs(pagination = {}) {
        try {
            const { page = 1, limit = 10 } = pagination;
            const skip = (page - 1) * limit;

            const [blogs, total] = await Promise.all([
                Blog.find()
                    .select({ __v: 0 })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(limit)),
                Blog.countDocuments()
            ]);

            logger.info(`Fetched ${blogs.length} blogs`);
            return {
                blogs,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            logger.error('Error fetching blogs:', error.message);
            throw error;
        }
    },

    // Get blog by ID
    async getBlogById(id) {
        try {
            const blog = await Blog.findById(id).select({ __v: 0 });
            if (!blog) {
                throw new Error('Blog not found');
            }
            logger.info('Blog fetched successfully:', blog._id);
            return blog;
        } catch (error) {
            if (error.name === 'CastError') {
                error.message = 'Invalid blog ID format';
            }
            logger.error('Error fetching blog:', error.message);
            throw error;
        }
    },

    // Get all team members
    async getTeamMembers() {
        try {
            const teamMembers = await TeamMember.find().select({ __v: 0 }).sort({ createdAt: -1 });
            logger.info(`Fetched ${teamMembers.length} team members`);
            return teamMembers;
        } catch (error) {
            logger.error('Error fetching team members:', error.message);
            throw error;
        }
    },

    // Get team member by ID
    async getTeamMemberById(id) {
        try {
            const teamMember = await TeamMember.findById(id).select({ __v: 0 });
            if (!teamMember) {
                throw new Error('Team member not found');
            }
            logger.info('Team member fetched successfully:', teamMember._id);
            return teamMember;
        } catch (error) {
            if (error.name === 'CastError') {
                error.message = 'Invalid team member ID format';
            }
            logger.error('Error fetching team member:', error.message);
            throw error;
        }
    }
};

module.exports = publicService; 