const Stripe = require('stripe');
const mongoose = require('mongoose');
const { Users } = require('../models/users'); // Adjust path to your Users model

class StripeService {
    constructor() {
        // Initialize Stripe with secret key from environment variables
        this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
            apiVersion: '2023-10-16' // Use a specific API version
        });
        this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    }

    /**
     * Create a Stripe customer and link to a user
     * @param {string} userId - MongoDB user ID
     * @param {string} email - User's email
     * @param {string} name - User's name
     * @returns {Promise<string>} Stripe customer ID
     */
    async createCustomer(userId, email, name) {
        try {
            // Check if user already has a Stripe customer ID
            const user = await Users.findById(userId);
            if (user.stripeCustomerId) {
                return user.stripeCustomerId;
            }

            // Create Stripe customer
            const customer = await this.stripe.customers.create({
                email,
                name,
                metadata: { userId: userId.toString() }
            });

            // Update user with Stripe customer ID
            await Users.findByIdAndUpdate(userId, {
                stripeCustomerId: customer.id
            });

            return customer.id;
        } catch (error) {
            throw new Error(`Failed to create Stripe customer: ${error.message}`);
        }
    }

    /**
     * Create a subscription for a customer
     * @param {string} customerId - Stripe customer ID
     * @param {string} priceId - Stripe price ID for the subscription
     * @param {Object} [options] - Additional subscription options
     * @returns {Promise<Object>} Subscription object
     */
    async createSubscription(customerId, priceId, options = {}) {
        try {
            const subscription = await this.stripe.subscriptions.create({
                customer: customerId,
                items: [{ price: priceId }],
                payment_behavior: 'default_incomplete',
                expand: ['latest_invoice.payment_intent'],
                ...options
            });

            return {
                subscriptionId: subscription.id,
                status: subscription.status,
                clientSecret: subscription.latest_invoice?.payment_intent?.client_secret || null 
            };
        } catch (error) {
            throw new Error(`Failed to create subscription: ${error.message}`);
        }
    }

    /**
     * Cancel a subscription
     * @param {string} subscriptionId - Stripe subscription ID
     * @returns {Promise<Object>} Canceled subscription object
     */
    async cancelSubscription(subscriptionId) {
        try {
            const subscription = await this.stripe.subscriptions.cancel(subscriptionId);
            return {
                subscriptionId: subscription.id,
                status: subscription.status
            };
        } catch (error) {
            throw new Error(`Failed to cancel subscription: ${error.message}`);
        }
    }

    /**
     * Create a one-time payment intent
     * @param {string} customerId - Stripe customer ID
     * @param {number} amount - Amount in cents
     * @param {string} currency - Currency code (e.g., 'usd')
     * @param {Object} [options] - Additional payment intent options
     * @returns {Promise<Object>} Payment intent object
     */
    async createPaymentIntent(customerId, amount, currency, options = {}) {
        try {
            const paymentIntent = await this.stripe.paymentIntents.create({
                customer: customerId,
                amount,
                currency,
                payment_method_types: ['card'],
                ...options
            });

            return {
                paymentIntentId: paymentIntent.id,
                clientSecret: paymentIntent.client_secret,
                status: paymentIntent.status
            };
        } catch (error) {
            throw new Error(`Failed to create payment intent: ${error.message}`);
        }
    }

    /**
     * Retrieve a customer's subscriptions
     * @param {string} customerId - Stripe customer ID
     * @returns {Promise<Array>} List of subscription objects
     */
    async getCustomerSubscriptions(customerId) {
        try {
            const subscriptions = await this.stripe.subscriptions.list({
                customer: customerId,
                status: 'all',
                expand: ['data.plan.product']
            });

            return subscriptions.data.map(sub => ({
                subscriptionId: sub.id,
                status: sub.status,
                plan: {
                    id: sub.plan?.id,
                    productId: sub.plan?.product?.id,
                    name: sub.plan?.product?.name,
                    amount: sub.plan?.amount,
                    currency: sub.plan?.currency,
                    interval: sub.plan?.interval
                },
                created: sub.created,
                currentPeriodEnd: sub.current_period_end
            }));
        } catch (error) {
            throw new Error(`Failed to retrieve subscriptions: ${error.message}`);
        }
    }

    /**
     * Retrieve a customer's payment methods
     * @param {string} customerId - Stripe customer ID
     * @returns {Promise<Array>} List of payment method objects
     */
    async getCustomerPaymentMethods(customerId) {
        try {
            const paymentMethods = await this.stripe.paymentMethods.list({
                customer: customerId,
                type: 'card'
            });

            return paymentMethods.data.map(pm => ({
                id: pm.id,
                brand: pm.card?.brand,
                last4: pm.card?.last4,
                expMonth: pm.card?.exp_month,
                expYear: pm.card?.exp_year
            }));
        } catch (error) {
            throw new Error(`Failed to retrieve payment methods: ${error.message}`);
        }
    }

    /**
     * Handle Stripe webhook events
     * @param {Object} req - Express request object
     * @returns {Promise<Object>} Webhook event result
     */
    async handleWebhook(req) {
        try {
            const sig = req.headers['stripe-signature'];
            const event = this.stripe.webhooks.constructEvent(
                req.body,
                sig,
                this.webhookSecret
            );

            switch (event.type) {
                case 'customer.subscription.updated':
                case 'customer.subscription.deleted':
                    const subscription = event.data.object;
                    // Update user subscription status in your database
                    await Users.findOneAndUpdate(
                        { stripeCustomerId: subscription.customer },
                        { subscriptionStatus: subscription.status }
                    );
                    return { event: event.type, subscriptionId: subscription.id };
                case 'payment_intent.succeeded':
                    const paymentIntent = event.data.object;
                    // Handle successful payment (e.g., update order status)
                    return { event: event.type, paymentIntentId: paymentIntent.id };
                case 'payment_intent.payment_failed':
                    const failedPayment = event.data.object;
                    // Handle failed payment (e.g., notify user)
                    return { event: event.type, paymentIntentId: failedPayment.id };
                default:
                    console.log(`Unhandled event type: ${event.type}`);
                    return { event: event.type, message: 'Event received but not handled' };
            }
        } catch (error) {
            throw new Error(`Webhook error: ${error.message}`);
        }
    }

    /**
     * Create a checkout session for a one-time payment or subscription
     * @param {string} customerId - Stripe customer ID
     * @param {string} priceId - Stripe price ID (for subscription or one-time)
     * @param {string} successUrl - URL to redirect after success
     * @param {string} cancelUrl - URL to redirect after cancellation
     * @param {string} mode - 'payment' for one-time, 'subscription' for recurring
     * @returns {Promise<Object>} Checkout session object
     */
    async createCheckoutSession(customerId, priceId, successUrl, cancelUrl, mode = 'subscription') {
        try {
            const session = await this.stripe.checkout.sessions.create({
                customer: customerId,
                payment_method_types: ['card'],
                line_items: [{ price: priceId, quantity: 1 }],
                mode,
                success_url: successUrl,
                cancel_url: cancelUrl
            });

            return {
                sessionId: session.id,
                url: session.url
            };
        } catch (error) {
            throw new Error(`Failed to create checkout session: ${error.message}`);
        }
    }
}

module.exports = StripeService;