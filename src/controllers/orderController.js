const orderService = require('../services/orderService');
const { createSuccessResponse } = require('../utils/response');
const { STATUS_CODES } = require('../constants/statusCodes');
const { SUCCESS_MESSAGES, ERROR_MESSAGES } = require('../constants/messages');

// Simple order controller - clean functional code
const orderController = {
    // Create order
    createOrder: async (req, res) => {
        try {
            const order = await orderService.createOrder(req.body);
            res.status(STATUS_CODES.CREATED).json({
                success: true,
                message: SUCCESS_MESSAGES.ORDER_CREATED,
                data: order
            });
        } catch (error) {
            if (error.name === 'ValidationError') {
                return res.status(STATUS_CODES.BAD_REQUEST).json({
                    success: false,
                    error: error.message,
                    details: error.errors
                });
            }
            if (error.name === 'CastError') {
                return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, error: ERROR_MESSAGES.INVALID_ID_FORMAT });
            }
            res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, error: ERROR_MESSAGES.ORDER_CREATION_FAILED });
        }
    },

    // Get order by ID
    getOrderById: async (req, res) => {
        try {
            const order = await orderService.getOrderById(req.params.id);
            res.status(STATUS_CODES.OK).json({
                success: true,
                message: SUCCESS_MESSAGES.ORDER_FETCHED,
                data: order
            });
        } catch (error) {
            if (error.name === 'CastError') {
                return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, error: ERROR_MESSAGES.INVALID_ID_FORMAT });
            }
            if (error.message === 'Order not found') {
                return res.status(STATUS_CODES.NOT_FOUND).json({ success: false, error: ERROR_MESSAGES.ORDER_NOT_FOUND });
            }
            res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, error: ERROR_MESSAGES.ORDER_FETCH_FAILED });
        }
    },

    // Get all orders
    getAllOrders: async (req, res) => {
        try {
            const { page, limit, status, email } = req.query;
            const filters = { status, email };
            const pagination = { page, limit };
            const result = await orderService.getAllOrders(filters, pagination);
            res.status(STATUS_CODES.OK).json({
                success: true,
                message: SUCCESS_MESSAGES.ORDERS_FETCHED,
                data: {
                    orders: result.orders,
                    pagination: result.pagination
                }
            });
        } catch (error) {
            res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, error: ERROR_MESSAGES.ORDER_FETCH_FAILED });
        }
    },

    // Update order status
    updateOrderStatus: async (req, res) => {
        try {
            const order = await orderService.updateOrderStatus(req.params.id, req.body);
            res.status(STATUS_CODES.OK).json({
                success: true,
                message: SUCCESS_MESSAGES.ORDER_UPDATED,
                data: order
            });
        } catch (error) {
            if (error.name === 'ValidationError') {
                return res.status(STATUS_CODES.BAD_REQUEST).json({
                    success: false,
                    error: error.message,
                    details: error.errors
                });
            }
            if (error.name === 'CastError') {
                return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, error: ERROR_MESSAGES.INVALID_ID_FORMAT });
            }
            if (error.name === 'NotFoundError' || error.message === 'Order not found') {
                return res.status(STATUS_CODES.NOT_FOUND).json({ success: false, error: ERROR_MESSAGES.ORDER_NOT_FOUND });
            }
            res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, error: ERROR_MESSAGES.ORDER_UPDATE_FAILED });
        }
    },

    // Get order statistics
    getOrderStatistics: async (req, res) => {
        try {
            const statistics = await orderService.getOrderStatistics();
            res.status(STATUS_CODES.OK).json({
                success: true,
                message: SUCCESS_MESSAGES.ORDERS_FETCHED,
                data: statistics
            });
        } catch (error) {
            res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, error: ERROR_MESSAGES.ORDER_FETCH_FAILED });
        }
    },

    // Delete order
    deleteOrder: async (req, res) => {
        try {
            const order = await orderService.deleteOrder(req.params.id);
            res.status(STATUS_CODES.OK).json({
                success: true,
                message: SUCCESS_MESSAGES.ORDER_DELETED
            });
        } catch (error) {
            if (error.name === 'CastError') {
                return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, error: ERROR_MESSAGES.INVALID_ID_FORMAT });
            }
            if (error.message === 'Order not found') {
                return res.status(STATUS_CODES.NOT_FOUND).json({ success: false, error: ERROR_MESSAGES.ORDER_NOT_FOUND });
            }
            if (error.name === 'ValidationError') {
                return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, error: error.message });
            }
            res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, error: ERROR_MESSAGES.ORDER_DELETION_FAILED });
        }
    }
};

module.exports = orderController; 