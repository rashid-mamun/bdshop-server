import { Request, Response } from 'express';
import mongoose from 'mongoose';
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
import { buildCheckoutQuote } from '../services/checkoutPricingService';
import { sendOrderConfirmationEmail } from '../services/emailService';

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
            const { paymentMethodId, items, shippingAddress, couponCode, idempotencyKey } =
                req.body;
            const requesterEmail = (req as RequestWithUser).user?.email;
            const requesterId = (req as RequestWithUser).user?.id;
            const orderEmail = requesterEmail || req.body.email;

            if (!orderEmail) {
                return res.status(STATUS_CODES.BAD_REQUEST).json({
                    success: false,
                    error: 'Email is required',
                });
            }

            if (!Array.isArray(items) || items.length === 0) {
                return res.status(STATUS_CODES.BAD_REQUEST).json({
                    success: false,
                    error: 'Items must be a non-empty array',
                });
            }

            const quote = await buildCheckoutQuote(items, couponCode);
            const normalizedItems = quote.items;
            const totals = quote.totals;

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
                    const intent = await stripe.paymentIntents.create(
                        {
                            amount: Math.round(totals.total * 100),
                            currency: 'bdt',
                            payment_method: paymentMethodId,
                            confirm: true,
                            return_url: `${environment.FRONTEND_URL}/my-account?tab=orders`,
                            metadata: {
                                email: orderEmail,
                                couponCode: totals.couponCode,
                            },
                        },
                        typeof idempotencyKey === 'string' && idempotencyKey
                            ? { idempotencyKey }
                            : undefined,
                    );

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
                userId: requesterId,
                email: orderEmail,
                items: normalizedItems,
                subtotal: totals.subtotal,
                shippingFee: totals.shippingFee,
                tax: totals.tax,
                discount: totals.discount,
                couponCode: totals.couponCode,
                total: totals.total,
                paymentStatus,
                paymentId,
                status: 'pending',
            });

            const savedOrder = order as { _id?: unknown; id?: unknown; orderNumber?: string };
            const orderId =
                savedOrder.orderNumber || String(savedOrder._id || savedOrder.id || 'pending');
            await sendOrderConfirmationEmail(orderEmail, orderId, totals.total);

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

    quoteOrder: async (req: Request, res: Response) => {
        try {
            const quote = await buildCheckoutQuote(req.body.items, req.body.couponCode);
            res.status(STATUS_CODES.OK).json(
                createSuccessResponse(quote, 'Checkout quote created'),
            );
        } catch (error: Error | unknown) {
            if (getErrorName(error) === 'ValidationError') {
                return res.status(STATUS_CODES.BAD_REQUEST).json({
                    success: false,
                    error: getErrorMessage(error),
                });
            }
            if (getErrorName(error) === 'NotFoundError' || getErrorName(error) === 'CastError') {
                return res
                    .status(STATUS_CODES.BAD_REQUEST)
                    .json({ success: false, error: ERROR_MESSAGES.SERVICE_NOT_FOUND });
            }
            res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: 'Unable to create checkout quote',
            });
        }
    },

    handleStripeWebhook: async (req: Request, res: Response) => {
        const signature = req.headers['stripe-signature'];
        if (!environment.STRIPE_WEBHOOK_SECRET) {
            return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: 'Stripe webhook is not configured',
            });
        }
        if (typeof signature !== 'string') {
            return res.status(STATUS_CODES.BAD_REQUEST).json({
                success: false,
                error: 'Missing Stripe signature',
            });
        }

        let event: any;
        try {
            event = stripe.webhooks.constructEvent(
                req.body,
                signature,
                environment.STRIPE_WEBHOOK_SECRET,
            );
        } catch (error: Error | unknown) {
            logger.warn('Invalid Stripe webhook signature', { error: getErrorMessage(error) });
            return res.status(STATUS_CODES.BAD_REQUEST).json({
                success: false,
                error: 'Invalid Stripe signature',
            });
        }

        try {
            if (event.type === 'payment_intent.succeeded') {
                const intent = event.data.object as any;
                await Order.findOneAndUpdate(
                    { paymentId: intent.id },
                    { paymentStatus: 'paid', status: 'confirmed' },
                );
            }

            if (event.type === 'payment_intent.payment_failed') {
                const intent = event.data.object as any;
                await Order.findOneAndUpdate(
                    { paymentId: intent.id },
                    { paymentStatus: 'failed', status: 'cancelled' },
                );
            }

            return res.json({ received: true });
        } catch (error: Error | unknown) {
            logger.error('Stripe webhook processing failed', { error: getErrorMessage(error) });
            return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: 'Stripe webhook processing failed',
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
                (!requester.id ||
                    !requester.email ||
                    String(order.userId || '') !== requester.id ||
                    order.email !== requester.email)
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
        const userId = (req as RequestWithUser).user?.id;
        if (!userEmail || !userId) {
            return res.status(STATUS_CODES.UNAUTHORIZED).json({
                success: false,
                error: ERROR_MESSAGES.UNAUTHORIZED,
            });
        }
        const filters: Record<string, unknown> = { userId, email: userEmail };
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
        const userId = (req as RequestWithUser).user?.id;
        if (!userEmail || !userId) {
            return res.status(STATUS_CODES.UNAUTHORIZED).json({
                success: false,
                error: ERROR_MESSAGES.UNAUTHORIZED,
            });
        }
        const [total, pending, completed] = await Promise.all([
            Order.countDocuments({ userId, email: userEmail }),
            Order.countDocuments({
                userId,
                email: userEmail,
                status: { $in: ['pending', 'confirmed', 'processing', 'shipped'] },
            }),
            Order.countDocuments({ userId, email: userEmail, status: 'delivered' }),
        ]);
        res.status(STATUS_CODES.OK).json({
            success: true,
            data: { total, pending, completed },
        });
    }),

    trackOrder: asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        const { email } = req.query as { email?: string };
        const trimmedOrderId = String(id || '').trim();

        if (!email) {
            return res.status(STATUS_CODES.BAD_REQUEST).json({
                success: false,
                error: 'Email is required',
            });
        }

        if (!trimmedOrderId) {
            return res.status(STATUS_CODES.BAD_REQUEST).json({
                success: false,
                error: 'Order ID is required',
            });
        }

        const orderLookup: Record<string, unknown>[] = [
            { orderNumber: trimmedOrderId.toUpperCase() },
        ];
        if (mongoose.Types.ObjectId.isValid(trimmedOrderId)) {
            orderLookup.push({ _id: trimmedOrderId });
        }

        const order = await Order.findOne({
            email: email.toLowerCase(),
            $or: orderLookup,
        });
        if (!order) {
            return res.status(STATUS_CODES.NOT_FOUND).json({
                success: false,
                error: 'We could not find an order with that ID and email.',
            });
        }

        return res.status(STATUS_CODES.OK).json({
            success: true,
            message: SUCCESS_MESSAGES.ORDER_FETCHED,
            data: order,
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
