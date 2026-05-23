import Order from '../models/orders';
import {
    getErrorMessage,
    getErrorName,
    getErrorCode,
    getErrorProperty,
} from '../utils/errorHandler';
import { IOrder } from '../types';
import { logger } from '../utils/logger';
import { APP_CONFIG } from '../constants/config';

type OrderFilters = {
    status?: string;
    email?: string;
};

type PaginationOptions = {
    page?: string | number;
    limit?: string | number;
};

type OrderUpdateData = {
    status?: string;
    paymentStatus?: string;
};

const orderService = {
    async createOrder(orderData: Partial<IOrder>) {
        try {
            if (!orderData.status) orderData.status = 'pending';
            if (!orderData.paymentStatus) orderData.paymentStatus = 'pending';
            const order = new Order(orderData);
            const savedOrder = await order.save();
            logger.info('Order created:', savedOrder._id);
            return savedOrder;
        } catch (error: any) {
            logger.error('Create order error:', getErrorMessage(error));
            throw error;
        }
    },

    async getOrderById(id: string) {
        try {
            const order = await Order.findById(id);
            if (!order) throw new Error('Order not found');
            return order;
        } catch (error: any) {
            logger.error('Get order error:', getErrorMessage(error));
            throw error;
        }
    },

    async getAllOrders(filters: OrderFilters = {}, pagination: PaginationOptions = {}) {
        try {
            const requestedPage = Number(pagination.page ?? 1);
            const requestedLimit = Number(pagination.limit ?? APP_CONFIG.DEFAULT_LIMIT);
            const currentPage = Math.max(1, Number.isFinite(requestedPage) ? requestedPage : 1);
            const pageSize = Math.min(
                APP_CONFIG.MAX_PAGE_SIZE,
                Math.max(
                    1,
                    Number.isFinite(requestedLimit) ? requestedLimit : APP_CONFIG.DEFAULT_LIMIT,
                ),
            );
            const skip = (currentPage - 1) * pageSize;

            const query: Record<string, unknown> = {};
            if (filters.status) query.status = filters.status;
            if (filters.email) query.email = filters.email;

            const [orders, total] = await Promise.all([
                Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(pageSize),
                Order.countDocuments(query),
            ]);

            return {
                orders,
                pagination: {
                    page: currentPage,
                    limit: pageSize,
                    total,
                    pages: Math.ceil(total / pageSize),
                },
            };
        } catch (error: any) {
            logger.error('Get orders error:', getErrorMessage(error));
            throw error;
        }
    },

    async updateOrderStatus(id: string, updateData: OrderUpdateData) {
        try {
            const updateFields: Record<string, unknown> = {};
            if (updateData.status) {
                const validStatuses = [
                    'pending',
                    'confirmed',
                    'processing',
                    'shipped',
                    'delivered',
                    'cancelled',
                ];
                if (!validStatuses.includes(updateData.status)) {
                    throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
                }
                updateFields.status = updateData.status;
            }
            if (updateData.paymentStatus) {
                const validPaymentStatuses = ['pending', 'paid', 'failed', 'refunded'];
                if (!validPaymentStatuses.includes(updateData.paymentStatus)) {
                    throw new Error(
                        `Invalid payment status. Must be one of: ${validPaymentStatuses.join(', ')}`,
                    );
                }
                updateFields.paymentStatus = updateData.paymentStatus;
            }
            const order = await Order.findByIdAndUpdate(id, updateFields, {
                new: true,
                runValidators: true,
            });
            if (!order) {
                const notFound = new Error('Order not found');
                notFound.name = 'NotFoundError';
                throw notFound;
            }
            return order;
        } catch (error: any) {
            logger.error('Update order error:', getErrorMessage(error));
            throw error;
        }
    },

    async deleteOrder(id: string) {
        try {
            const order = await Order.findByIdAndDelete(id);
            if (!order) throw new Error('Order not found');
            logger.info('Order deleted:', id);
            return order;
        } catch (error: any) {
            logger.error('Delete order error:', getErrorMessage(error));
            throw error;
        }
    },

    async getOrderStatistics() {
        try {
            const [totalOrders, statusBreakdown, totalRevenue, recentOrders] = await Promise.all([
                Order.countDocuments(),
                Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
                Order.aggregate([{ $group: { _id: null, total: { $sum: '$total' } } }]),
                Order.find().sort({ createdAt: -1 }).limit(5),
            ]);

            const ordersByStatus: Record<string, unknown> = {};
            statusBreakdown.forEach((item) => {
                ordersByStatus[item._id] = item.count;
            });

            const averageOrderValue =
                totalOrders > 0 ? (totalRevenue[0]?.total || 0) / totalOrders : 0;

            return {
                totalOrders,
                totalRevenue: totalRevenue[0]?.total || 0,
                averageOrderValue,
                ordersByStatus,
                recentOrders,
            };
        } catch (error: any) {
            logger.error('Get statistics error:', getErrorMessage(error));
            throw error;
        }
    },
};

export default orderService;
