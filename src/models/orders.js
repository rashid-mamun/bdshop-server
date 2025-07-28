const mongoose = require('mongoose');

const orderSchema = mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    items: [{
        serviceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Service',
            required: [true, 'Service ID is required']
        },
        name: { type: String, required: [true, 'Item name is required'] },
        price: { type: Number, required: [true, 'Item price is required'], min: [0, 'Price cannot be negative'] },
        quantity: { type: Number, required: [true, 'Quantity is required'], min: [1, 'Quantity must be at least 1'] }
    }],
    total: { type: Number, required: [true, 'Total is required'], min: [0, 'Total cannot be negative'] },
    shippingAddress: {
        street: { type: String, required: [true, 'Street is required'] },
        city: { type: String, required: [true, 'City is required'] },
        postalCode: { type: String, required: [true, 'Postal code is required'] },
        country: { type: String, required: [true, 'Country is required'] }
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed'],
        default: 'pending'
    },
    status: {
        type: String,
        required: [true, 'Order status is required'],
        enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    }
}, {
    timestamps: true
});

// Add indexes for better performance
orderSchema.index({ email: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ date: -1 });
orderSchema.index({ email: 1, status: 1 });

module.exports = mongoose.model('Order', orderSchema);