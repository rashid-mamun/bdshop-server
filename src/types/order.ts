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
    orderNumber: string;
    userId?: mongoose.Types.ObjectId;
    email: string;
    items: IOrderItem[];
    subtotal: number;
    shippingFee: number;
    tax: number;
    discount: number;
    couponCode?: string;
    total: number;
    shippingAddress: IShippingAddress;
    paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
    paymentId?: string;
    status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
}
