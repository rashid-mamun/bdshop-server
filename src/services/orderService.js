const Order = require('../models/orders');
const { logger } = require('../utils/logger');

// Simple order service - clean functional code
const orderService = {
    // Create order
    async createOrder(orderData) {
        try {
            // Ensure status and paymentStatus have defaults if not provided
            if (!orderData.status) orderData.status = 'pending';
            if (!orderData.paymentStatus) orderData.paymentStatus = 'pending';
            const order = new Order(orderData);
            const savedOrder = await order.save();
            logger.info('Order created:', savedOrder._id);
            return savedOrder;
        } catch (error) {
            logger.error('Create order error:', error.message);
            throw error;
        }
    },

    // Get order by ID
    async getOrderById(id) {
        try {
            const order = await Order.findById(id);
            if (!order) throw new Error('Order not found');
            return order;
        } catch (error) {
            logger.error('Get order error:', error.message);
            throw error;
        }
    },

    // Get all orders
    async getAllOrders(filters = {}, pagination = {}) {
        try {
            const { page = 1, limit = 10 } = pagination;
            const skip = (page - 1) * limit;

            let query = {};
            if (filters.status) query.status = filters.status;
            if (filters.email) query.email = filters.email;

            const [orders, total] = await Promise.all([
                Order.find(query).skip(skip).limit(parseInt(limit)),
                Order.countDocuments(query)
            ]);

            return {
                orders,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            logger.error('Get orders error:', error.message);
            throw error;
        }
    },

    // Update order status and paymentStatus
    async updateOrderStatus(id, updateData) {
        try {
            const updateFields = {};
            if (updateData.status) {
                const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
                if (!validStatuses.includes(updateData.status)) {
                    throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
                }
                updateFields.status = updateData.status;
            }
            if (updateData.paymentStatus) {
                const validPaymentStatuses = ['pending', 'paid', 'failed'];
                if (!validPaymentStatuses.includes(updateData.paymentStatus)) {
                    throw new Error(`Invalid payment status. Must be one of: ${validPaymentStatuses.join(', ')}`);
                }
                updateFields.paymentStatus = updateData.paymentStatus;
            }
            const order = await Order.findByIdAndUpdate(id, updateFields, { new: true, runValidators: true });
            if (!order) {
                const notFound = new Error('Order not found');
                notFound.name = 'NotFoundError';
                throw notFound;
            }
            return order;
        } catch (error) {
            logger.error('Update order error:', error.message);
            throw error;
        }
    },

    // Delete order
    async deleteOrder(id) {
        try {
            const order = await Order.findByIdAndDelete(id);
            if (!order) throw new Error('Order not found');
            logger.info('Order deleted:', id);
            return order;
        } catch (error) {
            logger.error('Delete order error:', error.message);
            throw error;
        }
    },

    // Get order statistics
    async getOrderStatistics() {
        try {
            const [totalOrders, statusBreakdown, totalRevenue, recentOrders] = await Promise.all([
                Order.countDocuments(),
                Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
                Order.aggregate([{ $group: { _id: null, total: { $sum: '$total' } } }]),
                Order.find().sort({ createdAt: -1 }).limit(5)
            ]);

            const ordersByStatus = {};
            statusBreakdown.forEach(item => {
                ordersByStatus[item._id] = item.count;
            });

            const averageOrderValue = totalOrders > 0 ? totalRevenue[0]?.total / totalOrders : 0;

            return {
                totalOrders,
                totalRevenue: totalRevenue[0]?.total || 0,
                averageOrderValue,
                ordersByStatus,
                recentOrders
            };
        } catch (error) {
            logger.error('Get statistics error:', error.message);
            throw error;
        }
    }
};

module.exports = orderService; 