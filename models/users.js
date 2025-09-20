const mongoose = require('mongoose');
const crypto = require('crypto');

const UsersSchema = new mongoose.Schema({
    email: { type: String, required: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    profilePicture: { type: String, required: false },
    interest: { type: String, required: false },
    skills: { type: [String], required: false },
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
    referralCount: { type: Number, default: 0 },
    dailyReminder: { type: Boolean, default: false },
    dailyReminderTime: { type: String, default: "10:00" },
    emailVerified: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    lastLogin: {type: Date, required: false},
    expoPushToken: {type: String, required: false},
    cryptoBalance: { type: Number, default: 0 }, // USDT balance (in smallest units, e.g., 10^6 for 1 USDT)
    fiatBalance: { type: Number, default: 0 }, // USD balance (in cents)
    stripeCustomerId: { type: String }
});

const Users = mongoose.model('Users', UsersSchema);
module.exports = { Users }; 