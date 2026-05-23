import mongoose, { Schema } from 'mongoose';
import { IOrder } from '../types';

export type { IOrder } from '../types';

const orderSchema = new Schema<IOrder>(
    {
        email: {
            type: String,
            required: [true, 'Email is required'],
            lowercase: true,
            trim: true,
            match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
        },
        items: [
            {
                serviceId: {
                    type: Schema.Types.ObjectId,
                    ref: 'Service',
                    required: [true, 'Service ID is required'],
                },
                name: { type: String, required: [true, 'Item name is required'] },
                price: {
                    type: Number,
                    required: [true, 'Item price is required'],
                    min: [0, 'Price cannot be negative'],
                },
                quantity: {
                    type: Number,
                    required: [true, 'Quantity is required'],
                    min: [1, 'Quantity must be at least 1'],
                },
            },
        ],
        total: {
            type: Number,
            required: [true, 'Total is required'],
            min: [0, 'Total cannot be negative'],
        },
        shippingAddress: {
            fullName: { type: String },
            street: { type: String, required: [true, 'Street is required'] },
            city: { type: String },
            district: { type: String, required: [true, 'District is required'] },
            division: { type: String, required: [true, 'Division is required'] },
            postalCode: { type: String, required: [true, 'Postal code is required'] },
            country: { type: String, required: [true, 'Country is required'] },
            phone: { type: String, required: [true, 'Phone is required'] },
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'paid', 'failed', 'refunded'],
            default: 'pending',
        },
        paymentId: { type: String },
        status: {
            type: String,
            required: [true, 'Order status is required'],
            enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
            default: 'pending',
        },
    },
    {
        timestamps: true,
    },
);

orderSchema.index({ email: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ email: 1, status: 1 });

export const Order = mongoose.model<IOrder>('Order', orderSchema);
export default Order;
