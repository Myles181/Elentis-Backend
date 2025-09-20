// models/Community.js
const mongoose = require('mongoose');

const CommunitySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: false,
        default: ''
    },
    inviteCode: {
        type: String,
        required: true,
        unique: true
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required: true
    },
    members: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Users',
            required: true
        },
        approved: {
            type: Boolean,
            default: true
        },
        joinedAt: {
            type: Date,
            default: Date.now
        }
    }],
    isPrivate: {
        type: Boolean,
        default: false
    },
    // Optional: Image or other metadata
    image: {
        type: String,
        default: ''
    },
    requestRequired: {
        type: Boolean,
        default: false
    },
    invitations: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Users',
            required: true
        },
        invitedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Users'
        },
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes for performance
CommunitySchema.index({ creator: 1 });
CommunitySchema.index({ 'members': 1 });
CommunitySchema.index({ name: 'text' }); // For searching communities

module.exports = mongoose.model('Community', CommunitySchema);