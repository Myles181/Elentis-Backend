const mongoose = require('mongoose');
const crypto = require('crypto');

const UsersSchema = new mongoose.Schema({
    email: { type: String, required: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    profilePicture: { type: String, required: false },
    interest: { type: String, required: false },
    skills: { type: String, required: false },
    ipAddress: {type: String, required: false},
    location: {type: String, required: false},
    language: {type: String, required: false},
    googleId: {type: String, required: false},
    registrationMethod: { type: String, default: "normal" },
    referBy: { type: String, default: false },
    refCode: {
        type: String,
        default: function() {
            return crypto.randomBytes(6).toString('hex').toUpperCase();
        },
        unique: true
    },
    emailVerified: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    lastLogin: {type: Date, required: false},
});

const Users = mongoose.model('Users', UsersSchema);
module.exports = { Users }; 