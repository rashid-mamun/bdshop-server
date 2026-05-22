import mongoose, { Schema } from 'mongoose';
import { IBlog } from '../types';

export type { IBlog } from '../types';

const blogSchema = new Schema<IBlog>(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        img: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            trim: true,
        },
        date: {
            type: String,
            required: true,
        },
        category: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
    },
);

blogSchema.index({ title: 'text', description: 'text' });
blogSchema.index({ category: 1 });
blogSchema.index({ date: -1 });

export const Blog = mongoose.model<IBlog>('Blog', blogSchema);
export default Blog;
