import mongoose, { Schema, Document } from 'mongoose';

export interface IUploadedAsset extends Document {
    ownerEmail: string;
    url: string;
    publicId: string;
    storage: 'cloudinary' | 'local';
    status: 'pending' | 'attached';
    expiresAt: Date;
    attachedServiceId?: mongoose.Types.ObjectId;
}

const uploadedAssetSchema = new Schema<IUploadedAsset>(
    {
        ownerEmail: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        url: {
            type: String,
            required: true,
        },
        publicId: {
            type: String,
            required: true,
            index: true,
        },
        storage: {
            type: String,
            enum: ['cloudinary', 'local'],
            required: true,
        },
        status: {
            type: String,
            enum: ['pending', 'attached'],
            default: 'pending',
            index: true,
        },
        expiresAt: {
            type: Date,
            required: true,
            index: true,
        },
        attachedServiceId: {
            type: Schema.Types.ObjectId,
            ref: 'Service',
        },
    },
    {
        timestamps: true,
    },
);

uploadedAssetSchema.index({ ownerEmail: 1, status: 1, expiresAt: 1 });

export const UploadedAsset = mongoose.model<IUploadedAsset>('UploadedAsset', uploadedAssetSchema);
export default UploadedAsset;
