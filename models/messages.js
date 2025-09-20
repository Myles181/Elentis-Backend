// models/Message.js
const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    roomId: {
        type: String, // For direct: sorted user IDs (e.g., 'user1_user2'); For community: community._id.toString()
        required: true
    },
    communityId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Community',
        required: false // Null for direct messages
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required: true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required: false // Null for community messages
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    messageType: {
        type: String,
        enum: ['direct', 'community'],
        required: true
    },
    read: {
        type: Array,
        default: []
    },
    // Optional: For reactions, edits, etc.
    edited: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Indexes for fast retrieval
MessageSchema.index({ roomId: 1, createdAt: -1 });
MessageSchema.index({ communityId: 1, createdAt: -1 });
MessageSchema.index({ sender: 1 });

module.exports = mongoose.model('Message', MessageSchema);