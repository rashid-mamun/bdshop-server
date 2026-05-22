import mongoose, { Schema } from 'mongoose';
import { IService } from '../types';

export type { IService } from '../types';

const serviceSchema = new Schema<IService>(
    {
        name: {
            type: String,
            required: [true, 'Service name is required'],
            trim: true,
            minlength: [2, 'Service name must be at least 2 characters long'],
        },
        model: {
            type: String,
            required: [true, 'Model is required'],
            trim: true,
        },
        img: {
            type: String,
            required: [true, 'Image URL is required'],
        },
        price: {
            type: Number,
            required: [true, 'Price is required'],
            min: [0, 'Price cannot be negative'],
        },
        description: {
            type: String,
            required: [true, 'Description is required'],
            trim: true,
        },
        config: {
            type: String,
            required: [true, 'Configuration is required'],
            trim: true,
        },
        category: {
            type: String,
            required: [true, 'Category is required'],
            trim: true,
        },
        madeIn: {
            type: String,
            required: [true, 'Manufacturing country is required'],
            trim: true,
        },
        date: {
            type: String,
            default: () => new Date().toISOString(),
        },
        averageRating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5,
        },
        reviewCount: {
            type: Number,
            default: 0,
            min: 0,
        },
        originalPrice: {
            type: Number,
        },
        stock: {
            type: Number,
            default: 100,
            min: 0,
        },
        images: {
            type: [String],
            default: [],
        },
        isFeatured: {
            type: Boolean,
            default: false,
        },
        isFlashDeal: {
            type: Boolean,
            default: false,
        },
        discountPercent: {
            type: Number,
            min: 0,
            max: 100,
        },
        isNewArrival: {
            type: Boolean,
            default: false,
        },
        tags: {
            type: [String],
            default: [],
        },
    },
    {
        timestamps: true,
    },
);

serviceSchema.index({ name: 'text', description: 'text' });
serviceSchema.index({ category: 1 });
serviceSchema.index({ price: 1 });
serviceSchema.index({ madeIn: 1 });
serviceSchema.index({ averageRating: 1 });

export const Service = mongoose.model<IService>('Service', serviceSchema);
export default Service;
