const mongoose = require('mongoose');

const ourTeamSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Team member name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters long']
    },
    img: {
        type: String,
        required: [true, 'Image URL is required']
    },
    url: {
        type: String,
        trim: true,
        match: [/^https?:\/\/.+/, 'Please enter a valid URL']
    },
    position: {
        type: String,
        required: [true, 'Position is required'],
        trim: true
    },
    bio: {
        type: String,
        trim: true,
        maxlength: [500, 'Bio cannot exceed 500 characters']
    },
    socialLinks: {
        linkedin: String,
        twitter: String,
        github: String
    }
}, {
    timestamps: true
});

// Add indexes for better performance
ourTeamSchema.index({ name: 1 });
ourTeamSchema.index({ position: 1 });

module.exports = ourTeamSchema;