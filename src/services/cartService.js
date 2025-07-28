const Cart = require('../models/carts');
const { logger } = require('../utils/logger');

// Single Responsibility: Handle all cart-related business logic
const cartService = {
    // Add item to cart
    async addToCart(cartData) {
        try {
            // Check if item exists for this user
            const existing = await Cart.findOne({ email: cartData.email, id: cartData.id });
            if (existing) {
                existing.quantity += cartData.quantity;
                const updated = await existing.save();
                logger.info('Cart item quantity updated successfully:', updated._id);
                return { cartItem: updated, created: false };
            } else {
                const cartItem = new Cart(cartData);
                const savedItem = await cartItem.save();
                logger.info('Item added to cart successfully:', savedItem._id);
                return { cartItem: savedItem, created: true };
            }
        } catch (error) {
            logger.error('Error adding item to cart:', error.message);
            throw error;
        }
    },

    // Get user's cart
    async getUserCart(email) {
        try {
            const cartItems = await Cart.find({ email }).select({ __v: 0 });
            logger.info(`Fetched ${cartItems.length} cart items for user: ${email}`);
            return cartItems;
        } catch (error) {
            logger.error('Error fetching user cart:', error.message);
            throw error;
        }
    },

    // Update cart item quantity
    async updateCartItemQuantity(id, quantity) {
        try {
            if (typeof quantity !== 'number' || quantity < 1) {
                const error = new Error('Quantity must be at least 1');
                error.name = 'ValidationError';
                throw error;
            }
            // Use findById, update quantity, and save to avoid required field validation
            const cartItem = await Cart.findById(id);
            if (!cartItem) return null;
            cartItem.quantity = quantity;
            await cartItem.save();
            return cartItem;
        } catch (error) {
            throw error;
        }
    },

    // Remove item from cart
    async removeFromCart(id) {
        try {
            const cartItem = await Cart.findByIdAndDelete(id);
            // If not found, return null
            return cartItem;
        } catch (error) {
            throw error;
        }
    },

    // Clear user's cart
    async clearUserCart(email) {
        try {
            const result = await Cart.deleteMany({ email });
            logger.info(`Cleared ${result.deletedCount} items from cart for user: ${email}`);
            return result;
        } catch (error) {
            logger.error('Error clearing user cart:', error.message);
            throw error;
        }
    },

    // Get cart summary
    async getCartSummary(email) {
        try {
            const cartItems = await Cart.find({ email });

            const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
            const totalPrice = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const itemCount = cartItems.length;

            logger.info(`Cart summary calculated for user: ${email}`);
            return {
                totalItems,
                totalPrice,
                itemCount
            };
        } catch (error) {
            logger.error('Error calculating cart summary:', error.message);
            throw error;
        }
    }
};

module.exports = cartService; 