import mongoose, { Schema } from 'mongoose';
import { IAddress } from '../types';

export type { IAddress } from '../types';

const addressSchema = new Schema<IAddress>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
        },
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
        },
        phone: {
            type: String,
            required: [true, 'Phone number is required'],
            trim: true,
        },
        addressLine: {
            type: String,
            required: [true, 'Address line is required'],
            trim: true,
        },
        district: {
            type: String,
            required: [true, 'District is required'],
            trim: true,
        },
        division: {
            type: String,
            required: [true, 'Division is required'],
            trim: true,
        },
        postalCode: {
            type: String,
            trim: true,
        },
        isDefault: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true },
);

addressSchema.index({ userId: 1 });
addressSchema.index({ userId: 1, isDefault: 1 });

export const Address = mongoose.model<IAddress>('Address', addressSchema);
export default Address;
