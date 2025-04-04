const mongoose = require('mongoose');

const WaitlistSchema = new mongoose.Schema({
    email: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});

const Waitlist = mongoose.model('Waitlist', WaitlistSchema);
module.exports = { Waitlist }; 