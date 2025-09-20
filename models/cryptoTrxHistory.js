// models/user.js
const mongoose = require('mongoose');

// models/cryptoTrxHistory.js
const cryptoTrxHistorySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  coinId: { type: Number, required: true }, // CCPayment coin ID
  coinName: { type: String, required: true }, // e.g., 'USDT'
  amount: { type: Number, required: true }, // Amount in smallest units
  type: { type: String, enum: ['deposit', 'withdrawal'], required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed', 'processing'], default: 'pending' },
  recordId: { type: String }, // CCPayment recordId
  orderId: { type: String }, // CCPayment orderId
  chain: { type: String }, // Blockchain network (e.g., 'POLYGON')
  fee: { type: Number }, // For withdrawals
  address: { type: String }, // Wallet address (for withdrawals)
  createdAt: { type: Date, default: Date.now }
});

cryptoTrxHistorySchema.index({ user: 1, recordId: 1 });
module.exports = mongoose.model('CryptoTrxHistory', cryptoTrxHistorySchema);