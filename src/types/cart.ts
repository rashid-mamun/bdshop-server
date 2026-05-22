import { Document } from 'mongoose';

export interface ICart extends Document {
    id: string;
    email: string;
    img: string;
    description: string;
    model: string;
    price: number;
    config?: string;
    quantity: number;
}
