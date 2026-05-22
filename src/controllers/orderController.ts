import { Request, Response } from 'express';
import orderService from '../services/orderService';
import { createSuccessResponse, sendSuccessResponse, sendErrorResponse } from '../utils/response';
import { STATUS_CODES } from '../constants/statusCodes';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '../constants/messages';
import { asyncHandler } from '../utils/asyncHandler';
import Order from '../models/orders';
import Service from '../models/services';
import Stripe from 'stripe';
import { logger } from '../utils/logger';
import {
    getErrorMessage,
    getErrorName,
    getErrorCode,
    getErrorProperty,
} from '../utils/errorHandler';
import { USER_ROLES } from '../constants/config';
import environment from '../config/environment';

type RequestWithUser = Request & {
    user?: {
        id?: string;
        email?: string;
        role?: string;
    };
};

const stripe = new Stripe(environment.STRIPE_SECRET_KEY || '', {
    apiVersion: '2022-11-15',
} as any);

type ReservedItem = {
    serviceId: string;
    quantity: number;
};

const restoreReservedStock = async (items: ReservedItem[]) => {
    await Promise.all(
        items.map((item) =>
            Service.updateOne({ _id: item.serviceId }, { $inc: { stock: item.quantity } }),
        ),
    );
};

const orderController = {
    createOrder: async (req: Request, res: Response) => {
        const reservedItems: ReservedItem[] = [];
        try {
            const { paymentMethodId, items, shippingAddress } = req.body;
            const requesterEmail = (req as RequestWithUser).user?.email;

            if (!requesterEmail) {
                return res.status(STATUS_CODES.UNAUTHORIZED).json({
                    success: false,
                    error: ERROR_MESSAGES.UNAUTHORIZED,
                });
            }

            if (!Array.isArray(items) || items.length === 0) {
                return res.status(STATUS_CODES.BAD_REQUEST).json({
                    success: false,
                    error: 'Items must be a non-empty array',
                });
            }

            const normalizedItems = await Promise.all(
                items.map(async (item: any) => {
                    if (!item?.serviceId) {
                        const error = new Error('Service ID is required');
                        error.name = 'ValidationError';
                        throw error;
                    }
                    const quantity = Number(item.quantity);
                    if (!Number.isFinite(quantity) || quantity < 1) {
                        const error = new Error('Item quantity must be at least 1');
                        error.name = 'ValidationError';
                        throw error;
                    }

                    const service = await Service.findById(item.serviceId);
                    if (!service) {
                        const error = new Error('Service not found');
                        error.name = 'NotFoundError';
                        throw error;
                    }

                    if (service.stock < quantity) {
                        const error = new Error(`Only ${service.stock} item(s) left for ${service.name}`);
                        error.name = 'ValidationError';
                        throw error;
                    }

                    return {
                        serviceId: service._id,
                        name: service.name,
                        price: service.price,
                        quantity,
                    };
                }),
            );

            const computedTotal = normalizedItems.reduce(
                (sum, item) => sum + item.price * item.quantity,
                0,
            );

            let paymentId = '';
            let paymentStatus = 'pending';

            for (const item of normalizedItems) {
                const reservation = await Service.updateOne(
                    { _id: item.serviceId, stock: { $gte: item.quantity } },
                    { $inc: { stock: -item.quantity } },
                );

                if (reservation.modifiedCount !== 1) {
                    const error = new Error(`Insufficient stock for ${item.name}`);
                    error.name = 'ValidationError';
                    throw error;
                }

                reservedItems.push({
                    serviceId: item.serviceId.toString(),
                    quantity: item.quantity,
                });
            }

            if (paymentMethodId) {
                if (!environment.STRIPE_SECRET_KEY) {
                    await restoreReservedStock(reservedItems);
                    reservedItems.length = 0;
                    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
                        success: false,
                        error: 'Stripe is not configured',
                    });
                }

                try {
                    const intent = await stripe.paymentIntents.create({
                        amount: Math.round(computedTotal * 100),
                        currency: 'bdt',
                        payment_method: paymentMethodId,
                        confirm: true,
                        return_url: `${environment.FRONTEND_URL}/my-account?tab=orders`,
                    });

                    logger.info('Stripe Intent Status:', intent.status);

                    if (intent.status === 'succeeded' || intent.status === 'requires_capture') {
                        paymentId = intent.id;
                        paymentStatus = 'paid';
                    } else if (intent.status === 'requires_action') {
                        await restoreReservedStock(reservedItems);
                        reservedItems.length = 0;
                        return res.status(STATUS_CODES.BAD_REQUEST).json({
                            success: false,
                            error: 'Action required',
                            clientSecret: intent.client_secret,
                            status: intent.status,
                        });
                    } else {
                        await restoreReservedStock(reservedItems);
                        reservedItems.length = 0;
                        return res.status(STATUS_CODES.BAD_REQUEST).json({
                            success: false,
                            error: `Payment failed with status: ${intent.status}`,
                        });
                    }
                } catch (stripeErr: Error | unknown) {
                    await restoreReservedStock(reservedItems);
                    reservedItems.length = 0;
                    const errorMessage =
                        stripeErr instanceof Error ? stripeErr.message : String(stripeErr);
                    return res.status(STATUS_CODES.BAD_REQUEST).json({
                        success: false,
                        error: errorMessage || 'Stripe payment failed',
                    });
                }
            }

            const order = await orderService.createOrder({
                ...req.body,
                email: requesterEmail,
                items: normalizedItems,
                total: computedTotal,
                paymentStatus,
                paymentId,
                status: 'pending',
            });

            res.status(STATUS_CODES.CREATED).json({
                success: true,
                message: SUCCESS_MESSAGES.ORDER_CREATED,
                data: order,
            });
        } catch (error: Error | unknown) {
            if (reservedItems.length > 0) {
                await restoreReservedStock(reservedItems);
            }
            if (getErrorName(error) === 'ValidationError') {
                return res.status(STATUS_CODES.BAD_REQUEST).json({
                    success: false,
                    error: getErrorMessage(error),
                    details: getErrorProperty(error, 'errors'),
                });
            }
            if (getErrorName(error) === 'NotFoundError') {
                return res
                    .status(STATUS_CODES.BAD_REQUEST)
                    .json({ success: false, error: ERROR_MESSAGES.SERVICE_NOT_FOUND });
            }
            if (getErrorName(error) === 'CastError') {
                return res
                    .status(STATUS_CODES.BAD_REQUEST)
                    .json({ success: false, error: ERROR_MESSAGES.INVALID_ID_FORMAT });
            }
            res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: ERROR_MESSAGES.ORDER_CREATION_FAILED,
            });
        }
    },

    getOrderById: async (req: Request, res: Response) => {
        try {
            const order = await orderService.getOrderById(req.params.id as string);
            const requester = (req as RequestWithUser).user;
            if (
                requester &&
                requester.role !== USER_ROLES.ADMIN &&
                requester.role !== USER_ROLES.SUPER_ADMIN &&
                requester.email &&
                requester.email !== order.email
            ) {
                return res
                    .status(STATUS_CODES.FORBIDDEN)
                    .json({ success: false, error: ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS });
            }
            res.status(STATUS_CODES.OK).json({
                success: true,
                message: SUCCESS_MESSAGES.ORDER_FETCHED,
                data: order,
            });
        } catch (error: Error | unknown) {
            if (getErrorName(error) === 'CastError') {
                return res
                    .status(STATUS_CODES.BAD_REQUEST)
                    .json({ success: false, error: ERROR_MESSAGES.INVALID_ID_FORMAT });
            }
            if (getErrorMessage(error) === 'Order not found') {
                return res
                    .status(STATUS_CODES.NOT_FOUND)
                    .json({ success: false, error: ERROR_MESSAGES.ORDER_NOT_FOUND });
            }
            res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: ERROR_MESSAGES.ORDER_FETCH_FAILED,
            });
        }
    },

    getAllOrders: async (req: Request, res: Response) => {
        try {
            const { page, limit, status, email } = req.query as Record<string, unknown>;
            const filters = {
                status: status as string | undefined,
                email: email as string | undefined,
            };
            const pagination = {
                page: page as string | number | undefined,
                limit: limit as string | number | undefined,
            };
            const result = await orderService.getAllOrders(filters, pagination);
            res.status(STATUS_CODES.OK).json({
                success: true,
                message: SUCCESS_MESSAGES.ORDERS_FETCHED,
                data: {
                    orders: result.orders,
                    pagination: result.pagination,
                },
            });
        } catch (error: Error | unknown) {
            res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: ERROR_MESSAGES.ORDER_FETCH_FAILED,
            });
        }
    },

    getMyOrders: asyncHandler(async (req: Request, res: Response) => {
        const { page, limit, status } = req.query as Record<string, unknown>;
        const userEmail = (req as RequestWithUser).user?.email;
        if (!userEmail) {
            return res.status(STATUS_CODES.UNAUTHORIZED).json({
                success: false,
                error: ERROR_MESSAGES.UNAUTHORIZED,
            });
        }
        const filters: Record<string, unknown> = { email: userEmail };
        if (status && status !== 'all') filters.status = status;
        const result = await orderService.getAllOrders(filters as any, {
            page: page as string | number | undefined,
            limit: limit as string | number | undefined,
        });
        res.status(STATUS_CODES.OK).json({
            success: true,
            message: SUCCESS_MESSAGES.ORDERS_FETCHED,
            data: result,
        });
    }),

    getMyStats: asyncHandler(async (req: Request, res: Response) => {
        const userEmail = (req as RequestWithUser).user?.email;
        if (!userEmail) {
            return res.status(STATUS_CODES.UNAUTHORIZED).json({
                success: false,
                error: ERROR_MESSAGES.UNAUTHORIZED,
            });
        }
        const [total, pending, completed] = await Promise.all([
            Order.countDocuments({ email: userEmail }),
            Order.countDocuments({
                email: userEmail,
                status: { $in: ['pending', 'confirmed', 'processing', 'shipped'] },
            }),
            Order.countDocuments({ email: userEmail, status: 'delivered' }),
        ]);
        res.status(STATUS_CODES.OK).json({
            success: true,
            data: { total, pending, completed },
        });
    }),

    updateOrderStatus: async (req: Request, res: Response) => {
        try {
            const order = await orderService.updateOrderStatus(req.params.id as string, req.body);
            res.status(STATUS_CODES.OK).json({
                success: true,
                message: SUCCESS_MESSAGES.ORDER_UPDATED,
                data: order,
            });
        } catch (error: Error | unknown) {
            if (getErrorName(error) === 'ValidationError') {
                return res.status(STATUS_CODES.BAD_REQUEST).json({
                    success: false,
                    error: getErrorMessage(error),
                    details: getErrorProperty(error, 'errors'),
                });
            }
            if (getErrorName(error) === 'CastError') {
                return res
                    .status(STATUS_CODES.BAD_REQUEST)
                    .json({ success: false, error: ERROR_MESSAGES.INVALID_ID_FORMAT });
            }
            if (
                getErrorName(error) === 'NotFoundError' ||
                getErrorMessage(error) === 'Order not found'
            ) {
                return res
                    .status(STATUS_CODES.NOT_FOUND)
                    .json({ success: false, error: ERROR_MESSAGES.ORDER_NOT_FOUND });
            }
            res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: ERROR_MESSAGES.ORDER_UPDATE_FAILED,
            });
        }
    },

    getOrderStatistics: async (req: Request, res: Response) => {
        try {
            const statistics = await orderService.getOrderStatistics();
            res.status(STATUS_CODES.OK).json({
                success: true,
                message: SUCCESS_MESSAGES.ORDERS_FETCHED,
                data: statistics,
            });
        } catch (error: Error | unknown) {
            res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: ERROR_MESSAGES.ORDER_FETCH_FAILED,
            });
        }
    },

    deleteOrder: async (req: Request, res: Response) => {
        try {
            await orderService.deleteOrder(req.params.id as string);
            res.status(STATUS_CODES.OK).json({
                success: true,
                message: SUCCESS_MESSAGES.ORDER_DELETED,
            });
        } catch (error: Error | unknown) {
            if (getErrorName(error) === 'CastError') {
                return res
                    .status(STATUS_CODES.BAD_REQUEST)
                    .json({ success: false, error: ERROR_MESSAGES.INVALID_ID_FORMAT });
            }
            if (getErrorMessage(error) === 'Order not found') {
                return res
                    .status(STATUS_CODES.NOT_FOUND)
                    .json({ success: false, error: ERROR_MESSAGES.ORDER_NOT_FOUND });
            }
            if (getErrorName(error) === 'ValidationError') {
                return res
                    .status(STATUS_CODES.BAD_REQUEST)
                    .json({ success: false, error: getErrorMessage(error) });
            }
            res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: ERROR_MESSAGES.ORDER_DELETION_FAILED,
            });
        }
    },
};

export default orderController;
