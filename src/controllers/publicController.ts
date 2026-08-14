import { Request, Response } from 'express';
import mongoose from 'mongoose';
import publicService from '../services/publicService';
import {
    getErrorMessage,
    getErrorName,
    getErrorCode,
    getErrorProperty,
} from '../utils/errorHandler';
import { createSuccessResponse, createErrorResponse } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';
import NewsletterSubscriber from '../models/newsletterSubscriber';
import ReturnRequest from '../models/returnRequest';
import Order from '../models/orders';
import { validateEmail } from '../middleware/validation';
import { sendReturnRequestEmail, sendEmail } from '../services/emailService';

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
            res.status(500).json({
                success: false,
                error: 'Something went wrong. Please try again.',
            });
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
            res.status(500).json({
                success: false,
                error: 'Something went wrong. Please try again.',
            });
        }
    }),

    subscribeNewsletter: asyncHandler(async (req: Request, res: Response) => {
        const { email, source } = req.body;
        if (!email || !validateEmail(email)) {
            return res.status(400).json({ success: false, error: 'Valid email is required' });
        }

        const subscriber = await NewsletterSubscriber.findOneAndUpdate(
            { email: String(email).toLowerCase() },
            { email, source: source || 'footer', status: 'subscribed' },
            { upsert: true, new: true, setDefaultsOnInsert: true },
        );

        await sendEmail({
            to: subscriber.email,
            subject: 'Welcome to BD Shop deals',
            text: 'You are subscribed to BD Shop updates and exclusive offers.',
        });

        return res.status(200).json(createSuccessResponse(subscriber, 'Newsletter subscribed'));
    }),

    createReturnRequest: asyncHandler(async (req: Request, res: Response) => {
        const { orderId, email, itemScope, reason, details, imageUrl } = req.body;
        if (!orderId || !email || !itemScope || !reason) {
            return res.status(400).json({
                success: false,
                error: 'orderId, email, itemScope, and reason are required',
            });
        }
        if (!validateEmail(email)) {
            return res.status(400).json({ success: false, error: 'Valid email is required' });
        }

        const normalizedOrderId = String(orderId).trim();
        const orderIdentifiers: Record<string, unknown>[] = [
            { orderNumber: normalizedOrderId.toUpperCase() },
        ];
        if (mongoose.Types.ObjectId.isValid(normalizedOrderId)) {
            orderIdentifiers.push({ _id: normalizedOrderId });
        }
        const order = await Order.findOne({
            email: String(email).toLowerCase(),
            $or: orderIdentifiers,
        });
        if (!order) {
            return res.status(404).json({ success: false, error: 'Order not found' });
        }

        const request = await ReturnRequest.create({
            orderId: order._id,
            email: String(email).toLowerCase(),
            itemScope,
            reason,
            details,
            imageUrl: imageUrl || '',
        });

        await sendReturnRequestEmail(email, request._id.toString());
        return res.status(201).json(createSuccessResponse(request, 'Return request submitted'));
    }),
};

export default publicController;
