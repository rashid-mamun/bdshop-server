import { Request, Response } from 'express';
import mongoose from 'mongoose';
import cartService from '../services/cartService';
import Cart from '../models/carts';
import {
    getErrorMessage,
    getErrorName,
    getErrorCode,
    getErrorProperty,
} from '../utils/errorHandler';
import { createSuccessResponse, createErrorResponse } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';
import { ERROR_MESSAGES } from '../constants/messages';
import { USER_ROLES } from '../constants/config';
import Service from '../models/services';

type RequestWithUser = Request & {
    user?: {
        email?: string;
        role?: string;
    };
};

const canAccessCart = (req: RequestWithUser, cartEmail?: string) => {
    const requester = req.user;
    if (!requester) return false;
    if (requester.role === USER_ROLES.ADMIN || requester.role === USER_ROLES.SUPER_ADMIN)
        return true;
    return Boolean(cartEmail && requester.email === cartEmail);
};

const cartController = {
    addToCart: asyncHandler(async (req: Request, res: Response) => {
        const requester = (req as RequestWithUser).user;
        if (!requester?.email) {
            return res.status(401).json(createErrorResponse(ERROR_MESSAGES.UNAUTHORIZED));
        }
        try {
            const service = mongoose.isValidObjectId(req.body.id)
                ? await Service.findById(req.body.id)
                : null;
            const cartData = service
                ? {
                      ...req.body,
                      email: requester.email,
                      id: service._id.toString(),
                      img: service.img,
                      description: service.description,
                      model: service.model,
                      price: service.price,
                      config: service.config,
                  }
                : { ...req.body, email: requester.email };

            if (service) {
                const requestedQuantity = Number(cartData.quantity) || 1;
                const existingItem = await Cart.findOne({
                    email: requester.email,
                    id: service._id.toString(),
                });
                const totalRequestedQuantity = requestedQuantity + (existingItem?.quantity || 0);
                if (service.stock < totalRequestedQuantity) {
                    return res
                        .status(400)
                        .json(createErrorResponse('Requested quantity is out of stock'));
                }
            }
            const { cartItem, created } = await cartService.addToCart(cartData);
            const responseData = {
                _id: cartItem._id,
                id: cartItem.id,
                email: cartItem.email,
                price: cartItem.price,
                quantity: cartItem.quantity,
            };
            if (created) {
                res.status(201).json(
                    createSuccessResponse(responseData, 'Item added to cart successfully'),
                );
            } else {
                res.status(200).json(
                    createSuccessResponse(responseData, 'Cart updated successfully'),
                );
            }
        } catch (error: Error | unknown) {
            if (getErrorName(error) === 'ValidationError') {
                res.status(400).json(createErrorResponse(getErrorMessage(error)));
            } else {
                res.status(500).json(createErrorResponse(getErrorMessage(error)));
            }
        }
    }),

    getUserCart: asyncHandler(async (req: Request, res: Response) => {
        const { email } = req.params;
        const cartItems = await cartService.getUserCart(email as string);

        res.status(200).json(createSuccessResponse(cartItems));
    }),

    updateCartItemQuantity: asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        const { quantity } = req.body;
        try {
            const cartItem = await Cart.findById(id as string);
            if (!cartItem) {
                return res.status(404).json(createErrorResponse('Cart not found'));
            }
            if (!canAccessCart(req as RequestWithUser, cartItem.email)) {
                return res
                    .status(403)
                    .json(createErrorResponse(ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS));
            }
            if (mongoose.isValidObjectId(cartItem.id)) {
                const service = await Service.findById(cartItem.id);
                if (service && service.stock < quantity) {
                    return res
                        .status(400)
                        .json(createErrorResponse('Requested quantity is out of stock'));
                }
            }
            cartItem.quantity = quantity;
            await cartItem.save();
            res.status(200).json(
                createSuccessResponse(
                    {
                        _id: cartItem._id,
                        id: cartItem.id,
                        email: cartItem.email,
                        price: cartItem.price,
                        quantity: cartItem.quantity,
                    },
                    'Cart updated successfully',
                ),
            );
        } catch (error: Error | unknown) {
            if (getErrorName(error) === 'ValidationError') {
                res.status(400).json(createErrorResponse(getErrorMessage(error)));
            } else {
                res.status(500).json(createErrorResponse(getErrorMessage(error)));
            }
        }
    }),

    removeFromCart: asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        try {
            const cartItem = await Cart.findById(id as string);
            if (!cartItem) {
                return res.status(404).json(createErrorResponse('Cart not found'));
            }
            if (!canAccessCart(req as RequestWithUser, cartItem.email)) {
                return res
                    .status(403)
                    .json(createErrorResponse(ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS));
            }
            await cartItem.deleteOne();
            res.status(200).json(
                createSuccessResponse(null, 'Item removed from cart successfully'),
            );
        } catch (error: Error | unknown) {
            if (getErrorName(error) === 'ValidationError') {
                res.status(400).json(createErrorResponse(getErrorMessage(error)));
            } else {
                res.status(500).json(createErrorResponse(getErrorMessage(error)));
            }
        }
    }),

    clearUserCart: asyncHandler(async (req: Request, res: Response) => {
        const { email } = req.params;
        const result = await cartService.clearUserCart(email as string);

        res.status(200).json(
            createSuccessResponse(
                { deletedCount: result.deletedCount },
                'Cart cleared successfully',
            ),
        );
    }),

    getCartSummary: asyncHandler(async (req: Request, res: Response) => {
        const { email } = req.params;
        const summary = await cartService.getCartSummary(email as string);

        res.status(200).json(createSuccessResponse(summary));
    }),
};

export default cartController;
