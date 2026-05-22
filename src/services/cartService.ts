import Cart from '../models/carts';
import {
    getErrorMessage,
    getErrorName,
    getErrorCode,
    getErrorProperty,
} from '../utils/errorHandler';
import { ICart } from '../types';
import { logger } from '../utils/logger';

const cartService = {
    async addToCart(cartData: Partial<ICart>) {
        try {
            const existing = await Cart.findOne({ email: cartData.email, id: cartData.id });
            if (existing) {
                existing.quantity += cartData.quantity || 1;
                const updated = await existing.save();
                logger.info('Cart item quantity updated successfully:', updated._id);
                return { cartItem: updated, created: false };
            } else {
                const cartItem = new Cart(cartData);
                const savedItem = await cartItem.save();
                logger.info('Item added to cart successfully:', savedItem._id);
                return { cartItem: savedItem, created: true };
            }
        } catch (error: any) {
            logger.error('Error adding item to cart:', getErrorMessage(error));
            throw error;
        }
    },

    async getUserCart(email: string) {
        try {
            const cartItems = await Cart.find({ email }).select({ __v: 0 });
            logger.info(`Fetched ${cartItems.length} cart items for user: ${email}`);
            return cartItems;
        } catch (error: any) {
            logger.error('Error fetching user cart:', getErrorMessage(error));
            throw error;
        }
    },

    async updateCartItemQuantity(id: string, quantity: number) {
        try {
            if (typeof quantity !== 'number' || quantity < 1) {
                const error = new Error('Quantity must be at least 1');
                error.name = 'ValidationError';
                throw error;
            }
            const cartItem = await Cart.findById(id);
            if (!cartItem) return null;
            cartItem.quantity = quantity;
            await cartItem.save();
            return cartItem;
        } catch (error: any) {
            throw error;
        }
    },

    async removeFromCart(id: string) {
        try {
            const cartItem = await Cart.findByIdAndDelete(id);
            return cartItem;
        } catch (error: any) {
            throw error;
        }
    },

    async clearUserCart(email: string) {
        try {
            const result = await Cart.deleteMany({ email });
            logger.info(`Cleared ${result.deletedCount} items from cart for user: ${email}`);
            return result;
        } catch (error: any) {
            logger.error('Error clearing user cart:', getErrorMessage(error));
            throw error;
        }
    },

    async getCartSummary(email: string) {
        try {
            const cartItems = await Cart.find({ email });

            const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
            const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
            const itemCount = cartItems.length;

            logger.info(`Cart summary calculated for user: ${email}`);
            return {
                totalItems,
                totalPrice,
                itemCount,
            };
        } catch (error: any) {
            logger.error('Error calculating cart summary:', getErrorMessage(error));
            throw error;
        }
    },
};

export default cartService;
