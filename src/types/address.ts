import mongoose from 'mongoose';

export interface IAddress extends Document {
    userId: mongoose.Types.ObjectId;
    name: string;
    phone: string;
    addressLine: string;
    district: string;
    division: string;
    postalCode?: string;
    isDefault: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
