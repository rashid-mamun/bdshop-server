import mongoose, { Schema } from 'mongoose';
import { IReview } from '../types';

export type { IReview } from '../types';

const reviewSchema = new Schema<IReview>(
    {
        name: {
            type: String,
            required: [true, 'Reviewer name is required'],
            trim: true,
            minlength: [2, 'Name must be at least 2 characters long'],
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            lowercase: true,
            trim: true,
            match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
        },
        serviceId: {
            type: Schema.Types.ObjectId,
            ref: 'Service',
            required: [true, 'Service ID is required'],
        },
        title: {
            type: String,
            required: [true, 'Review title is required'],
            trim: true,
            minlength: [5, 'Title must be at least 5 characters long'],
            maxlength: [100, 'Title cannot exceed 100 characters'],
        },
        img: {
            type: String,
            required: [true, 'Image URL is required'],
        },
        description: {
            type: String,
            trim: true,
            maxlength: [1000, 'Description cannot exceed 1000 characters'],
        },
        star: {
            type: Number,
            required: [true, 'Rating is required'],
            enum: [1, 2, 3, 4, 5],
            min: 1,
            max: 5,
        },
        date: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    },
);

reviewSchema.index({ email: 1 });
reviewSchema.index({ serviceId: 1 });
reviewSchema.index({ star: 1 });
reviewSchema.index({ date: -1 });
reviewSchema.index({ title: 'text', description: 'text' });
reviewSchema.index({ email: 1, serviceId: 1 }, { unique: true });

export const Review = mongoose.model<IReview>('Review', reviewSchema);
export default Review;
