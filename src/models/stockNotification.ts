import mongoose, { Schema, Document } from 'mongoose';

export interface IStockNotification extends Document {
    email: string;
    serviceId: mongoose.Types.ObjectId;
    status: 'pending' | 'notified';
    createdAt: Date;
    updatedAt: Date;
}

const stockNotificationSchema = new Schema<IStockNotification>(
    {
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
        serviceId: {
            type: Schema.Types.ObjectId,
            ref: 'Service',
            required: true,
        },
        status: {
            type: String,
            enum: ['pending', 'notified'],
            default: 'pending',
        },
    },
    {
        timestamps: true,
    },
);

export default mongoose.model<IStockNotification>('StockNotification', stockNotificationSchema);
