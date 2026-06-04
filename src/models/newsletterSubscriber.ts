import mongoose, { Schema } from 'mongoose';

const newsletterSubscriberSchema = new Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        source: {
            type: String,
            default: 'footer',
        },
        status: {
            type: String,
            enum: ['subscribed', 'unsubscribed'],
            default: 'subscribed',
        },
    },
    { timestamps: true },
);

newsletterSubscriberSchema.index({ email: 1 }, { unique: true });

export default mongoose.model('NewsletterSubscriber', newsletterSubscriberSchema);
