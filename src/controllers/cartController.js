const cartService = require('../services/cartService');
const { createSuccessResponse, createErrorResponse } = require('../utils/response');
const { asyncHandler } = require('../utils/asyncHandler');

// Single Responsibility: Handle HTTP requests and responses for cart operations
const cartController = {
    // Add item to cart endpoint
    addToCart: asyncHandler(async (req, res) => {
        const cartData = req.body;
        try {
            const { cartItem, created } = await cartService.addToCart(cartData);
            const responseData = {
                _id: cartItem._id,
                id: cartItem.id,
                email: cartItem.email,
                price: cartItem.price,
                quantity: cartItem.quantity
            };
            if (created) {
                res.status(201).json(createSuccessResponse(responseData, 'Item added to cart successfully'));
            } else {
                res.status(200).json(createSuccessResponse(responseData, 'Cart updated successfully'));
            }
        } catch (error) {
            if (error.name === 'ValidationError') {
                res.status(400).json(createErrorResponse(error.message));
            } else {
                res.status(500).json(createErrorResponse(error.message));
            }
        }
    }),

    // Get user's cart endpoint
    getUserCart: asyncHandler(async (req, res) => {
        const { email } = req.params;
        const cartItems = await cartService.getUserCart(email);

        res.status(200).json(createSuccessResponse(cartItems));
    }),

    // Update cart item quantity endpoint
    updateCartItemQuantity: asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { quantity } = req.body;
        try {
            const cartItem = await cartService.updateCartItemQuantity(id, quantity);
            if (!cartItem) {
                return res.status(404).json(createErrorResponse('Cart not found'));
            }
            res.status(200).json(createSuccessResponse(
                {
                    _id: cartItem._id,
                    id: cartItem.id,
                    email: cartItem.email,
                    price: cartItem.price,
                    quantity: cartItem.quantity
                },
                'Cart updated successfully'
            ));
        } catch (error) {
            if (error.name === 'ValidationError') {
                res.status(400).json(createErrorResponse(error.message));
            } else {
                res.status(500).json(createErrorResponse(error.message));
            }
        }
    }),

    // Remove item from cart endpoint
    removeFromCart: asyncHandler(async (req, res) => {
        const { id } = req.params;
        try {
            const cartItem = await cartService.removeFromCart(id);
            if (!cartItem) {
                return res.status(404).json(createErrorResponse('Cart not found'));
            }
            res.status(200).json(createSuccessResponse(null, 'Item removed from cart successfully'));
        } catch (error) {
            if (error.name === 'ValidationError') {
                res.status(400).json(createErrorResponse(error.message));
            } else {
                res.status(500).json(createErrorResponse(error.message));
            }
        }
    }),

    // Clear user's cart endpoint
    clearUserCart: asyncHandler(async (req, res) => {
        const { email } = req.params;
        const result = await cartService.clearUserCart(email);

        res.status(200).json(createSuccessResponse(
            { deletedCount: result.deletedCount },
            'Cart cleared successfully'
        ));
    }),

    // Get cart summary endpoint
    getCartSummary: asyncHandler(async (req, res) => {
        const { email } = req.params;
        const summary = await cartService.getCartSummary(email);

        res.status(200).json(createSuccessResponse(summary));
    })
};

module.exports = cartController; 