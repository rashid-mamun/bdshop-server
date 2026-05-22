import mongoose, { Document } from 'mongoose';

export interface IReview extends Document {
    name: string;
    email: string;
    serviceId: mongoose.Types.ObjectId;
    title: string;
    img: string;
    description?: string;
    star: 1 | 2 | 3 | 4 | 5;
    date: Date;
    createdAt?: Date;
    updatedAt?: Date;
}
