const mongoose = require('mongoose');

const blogSchema = mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    img: {
        type: String,
        required: true
    },
    description: {
        type: String,
        trim: true
    },
    date: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Add indexes for better performance
blogSchema.index({ title: 'text', description: 'text' });
blogSchema.index({ category: 1 });
blogSchema.index({ date: -1 });

module.exports = blogSchema;