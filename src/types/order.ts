import mongoose, { Document } from 'mongoose';

export interface IOrderItem {
    serviceId: mongoose.Types.ObjectId;
    name: string;
    price: number;
    quantity: number;
}

export interface IShippingAddress {
    fullName?: string;
    street: string;
    city?: string;
    district: string;
    division: string;
    postalCode: string;
    country: string;
    phone: string;
}

export interface IOrder extends Document {
    email: string;
    items: IOrderItem[];
    total: number;
    shippingAddress: IShippingAddress;
    paymentStatus: 'pending' | 'paid' | 'failed';
    paymentId?: string;
    status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
}
