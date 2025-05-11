const mongoose = require('mongoose');

const WaitlistSchema = new mongoose.Schema({
    email: { type: String, required: true },
    name: { type: String, required: true },
    interest: { type: String, required: true },
    skills: { type: String, required: true },
    earlyAccess: { type: Boolean, required: true },

    createdAt: { type: Date, default: Date.now },
});

const Waitlist = mongoose.model('Waitlist', WaitlistSchema);
module.exports = { Waitlist }; 