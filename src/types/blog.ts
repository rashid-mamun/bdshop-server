import { Document } from 'mongoose';

export interface IBlog extends Document {
    title: string;
    img: string;
    description?: string;
    date: string;
    category?: string;
}
