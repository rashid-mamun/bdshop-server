import { Request, Response } from 'express';
import publicService from '../services/publicService';
import {
    getErrorMessage,
    getErrorName,
    getErrorCode,
    getErrorProperty,
} from '../utils/errorHandler';
import { createSuccessResponse, createErrorResponse } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';

const publicController = {
    getAllBlogs: asyncHandler(async (req: Request, res: Response) => {
        const { page, limit } = req.query as any;
        const pagination = { page, limit };

        const result = await publicService.getAllBlogs(pagination);

        res.status(200).json(
            createSuccessResponse({
                blogs: result.blogs,
                pagination: result.pagination,
            }),
        );
    }),

    getBlogById: asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        try {
            const blog = await publicService.getBlogById(id as string);
            res.status(200).json(
                createSuccessResponse({
                    _id: blog._id,
                    title: blog.title,
                    img: blog.img,
                    description: blog.description,
                    date: blog.date,
                    category: blog.category,
                }),
            );
        } catch (error: Error | unknown) {
            if (getErrorMessage(error) === 'Blog not found') {
                return res.status(404).json({ success: false, error: 'Blog not found' });
            }
            if (getErrorName(error) === 'CastError') {
                return res.status(400).json({ success: false, error: 'Invalid blog ID format' });
            }
            res.status(500).json({ success: false, error: getErrorMessage(error) });
        }
    }),

    getTeamMembers: asyncHandler(async (req: Request, res: Response) => {
        const teamMembers = await publicService.getTeamMembers();

        res.status(200).json(createSuccessResponse(teamMembers));
    }),

    getTeamMemberById: asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        try {
            const teamMember = await publicService.getTeamMemberById(id as string);
            res.status(200).json(
                createSuccessResponse({
                    _id: teamMember._id,
                    name: teamMember.name,
                    position: teamMember.position,
                    img: teamMember.img,
                    bio: teamMember.bio,
                }),
            );
        } catch (error: Error | unknown) {
            if (getErrorMessage(error) === 'Team member not found') {
                return res.status(404).json({ success: false, error: 'Team member not found' });
            }
            if (getErrorName(error) === 'CastError') {
                return res
                    .status(400)
                    .json({ success: false, error: 'Invalid team member ID format' });
            }
            res.status(500).json({ success: false, error: getErrorMessage(error) });
        }
    }),
};

export default publicController;
