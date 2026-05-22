import mongoose, { Schema } from 'mongoose';
import { ICart } from '../types';

export type { ICart } from '../types';

const cartSchema = new Schema<ICart>(
    {
        id: {
            type: String,
            required: [true, 'Product ID is required'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            lowercase: true,
            trim: true,
            match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
        },
        img: {
            type: String,
            required: [true, 'Image URL is required'],
        },
        description: {
            type: String,
            required: [true, 'Description is required'],
            trim: true,
        },
        model: {
            type: String,
            required: [true, 'Model is required'],
            trim: true,
        },
        price: {
            type: Number,
            required: [true, 'Price is required'],
            min: [0, 'Price cannot be negative'],
        },
        config: {
            type: String,
            trim: true,
        },
        quantity: {
            type: Number,
            default: 1,
            min: [1, 'Quantity must be at least 1'],
        },
    },
    {
        timestamps: true,
    },
);

cartSchema.index({ email: 1 });
cartSchema.index({ id: 1 });
cartSchema.index({ email: 1, id: 1 }, { unique: true });

export const Cart = mongoose.model<ICart>('Cart', cartSchema);
export default Cart;
