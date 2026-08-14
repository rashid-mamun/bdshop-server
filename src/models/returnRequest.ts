import mongoose, { Schema } from 'mongoose';

const returnRequestSchema = new Schema(
    {
        orderId: {
            type: Schema.Types.ObjectId,
            ref: 'Order',
            required: true,
        },
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        itemScope: {
            type: String,
            enum: ['entire_order', 'specific_items'],
            required: true,
        },
        reason: {
            type: String,
            required: true,
            enum: ['damaged', 'wrong', 'not_described', 'changed_mind', 'other'],
        },
        details: {
            type: String,
            trim: true,
            maxlength: 2000,
        },
        imageUrl: {
            type: String,
            trim: true,
        },
        status: {
            type: String,
            enum: ['submitted', 'reviewing', 'approved', 'rejected', 'refunded'],
            default: 'submitted',
        },
    },
    { timestamps: true },
);

returnRequestSchema.index({ orderId: 1, email: 1 });
returnRequestSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('ReturnRequest', returnRequestSchema);
