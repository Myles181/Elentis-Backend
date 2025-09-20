const mongoose = require('mongoose');

const PlatformFeeSchema = new mongoose.Schema({
    type: { type: String, required: true, enum: ['withdrawal_crypto', 'withdrawal_fiat'], unique: true },
    fee: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

const PlatformFee = mongoose.model('PlatformFee', PlatformFeeSchema);
module.exports = { PlatformFee };
