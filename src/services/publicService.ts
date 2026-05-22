import Blog from '../models/blogs';
import {
    getErrorMessage,
    getErrorName,
    getErrorCode,
    getErrorProperty,
} from '../utils/errorHandler';
import TeamMember from '../models/ourTeams';
import { logger } from '../utils/logger';

const publicService = {
    async getAllBlogs(pagination: { page?: string | number; limit?: string | number } = {}) {
        try {
            const page = Number(pagination.page ?? 1);
            const limit = Number(pagination.limit ?? 10);
            const skip = (page - 1) * limit;

            const [blogs, total] = await Promise.all([
                Blog.find().select({ __v: 0 }).sort({ createdAt: -1 }).skip(skip).limit(limit),
                Blog.countDocuments(),
            ]);

            logger.info(`Fetched ${blogs.length} blogs`);
            return {
                blogs,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                },
            };
        } catch (error: any) {
            logger.error('Error fetching blogs:', getErrorMessage(error));
            throw error;
        }
    },

    async getBlogById(id: string) {
        try {
            const blog = await Blog.findById(id).select({ __v: 0 });
            if (!blog) {
                throw new Error('Blog not found');
            }
            logger.info('Blog fetched successfully:', blog._id);
            return blog;
        } catch (error: any) {
            if (getErrorName(error) === 'CastError') {
                error.message = 'Invalid blog ID format';
            }
            logger.error('Error fetching blog:', getErrorMessage(error));
            throw error;
        }
    },

    async getTeamMembers() {
        try {
            const teamMembers = await TeamMember.find().select({ __v: 0 }).sort({ createdAt: -1 });
            logger.info(`Fetched ${teamMembers.length} team members`);
            return teamMembers;
        } catch (error: any) {
            logger.error('Error fetching team members:', getErrorMessage(error));
            throw error;
        }
    },

    async getTeamMemberById(id: string) {
        try {
            const teamMember = await TeamMember.findById(id).select({ __v: 0 });
            if (!teamMember) {
                throw new Error('Team member not found');
            }
            logger.info('Team member fetched successfully:', teamMember._id);
            return teamMember;
        } catch (error: any) {
            if (getErrorName(error) === 'CastError') {
                error.message = 'Invalid team member ID format';
            }
            logger.error('Error fetching team member:', getErrorMessage(error));
            throw error;
        }
    },
};

export default publicService;
