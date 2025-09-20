const mongoose = require('mongoose');

const fiatTrxHistorySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true }, // Amount in cents
  currency: { type: String, default: 'usd' }, // e.g., 'usd'
  type: { type: String, enum: ['deposit', 'withdrawal'], required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  paymentIntentId: { type: String }, // Stripe paymentIntentId (for deposits)
  payoutId: { type: String }, // Stripe payoutId (for withdrawals)
  createdAt: { type: Date, default: Date.now }
});

fiatTrxHistorySchema.index({ user: 1, paymentIntentId: 1 });
fiatTrxHistorySchema.index({ user: 1, payoutId: 1 });
module.exports = mongoose.model('FiatTrxHistory', fiatTrxHistorySchema);