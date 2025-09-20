// controllers/stripeController.js
const { Users } = require('../models/users');
const FiatTrxHistory = require('../models/fiatTrxHistory');
const StripeService = require('../utils/stripe');

/**
 * Handles Stripe deposit request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.createDeposit = async (req, res) => {
  try {
    const userId = req.user._id;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    const user = await Users.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Users not found' });
    }

    const stripeService = new StripeService();
    const customerId = await stripeService.createCustomer(userId, user.email, user.name);
    const paymentIntent = await stripeService.createPaymentIntent(customerId, amount, 'usd');

    await new FiatTrxHistory({
      user: userId,
      amount,
      currency: 'usd',
      type: 'deposit',
      status: 'pending',
      paymentIntentId: paymentIntent.paymentIntentId
    }).save();

    res.json({ success: true, paymentIntent });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Handles Stripe withdrawal request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.createWithdrawal = async (req, res) => {
  try {
    const userId = req.user._id;
    const { amount, bankAccountId } = req.body;

    if (!amount || amount <= 0 || !bankAccountId) {
      return res.status(400).json({ error: 'Valid amount and bank account ID are required' });
    }

    const user = await Users.findById(userId);
    if (!user || user.fiatBalance < amount) {
      return res.status(400).json({ error: 'Insufficient fiat balance' });
    }

    const stripeService = new StripeService();
    const customerId = user.stripeCustomerId || (await stripeService.createCustomer(userId, user.email, user.name));
    const payout = await stripeService.createPayout(customerId, amount, bankAccountId);

    await Users.findByIdAndUpdate(userId, { $inc: { fiatBalance: -amount } });
    await new FiatTrxHistory({
      user: userId,
      amount,
      currency: 'usd',
      type: 'withdrawal',
      status: 'pending',
      payoutId: payout.payoutId
    }).save();

    res.json({ success: true, payout });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Handles Stripe webhook events
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.handleWebhook = async (req, res) => {
  try {
    const stripeService = new StripeService();
    const result = await stripeService.handleWebhook(req);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
};