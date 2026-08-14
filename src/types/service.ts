import { Document } from 'mongoose';

export interface IService extends Document {
    name: string;
    model: string;
    img: string;
    imgPublicId?: string;
    imgStorage?: 'cloudinary' | 'local' | 'external' | '';
    price: number;
    description: string;
    config: string;
    specifications?: Record<string, string>;
    category: string;
    madeIn: string;
    date: string;
    averageRating: number;
    reviewCount: number;
    originalPrice?: number;
    stock: number;
    images: string[];
    isFeatured: boolean;
    isFlashDeal: boolean;
    discountPercent?: number;
    isNewArrival: boolean;
    tags: string[];
}
