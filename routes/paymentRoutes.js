// routes/paymentRoutes.js
const express = require('express');
const { check } = require('express-validator');
const { tokenRequired } = require('../middleware/auth');
const stripeController = require('../controller/stripe');
const ccpaymentController = require('../controller/ccpayment');
const router = express.Router();

/**
 * @swagger
 * /api/payments/stripe/deposit:
 *   post:
 *     summary: Create a fiat deposit payment intent
 *     description: Initiates a Stripe payment intent for depositing fiat currency (e.g., USD) into the user's account.
 *     tags: [Payments]
 *     security:
 *       - elentisAccessToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Amount to deposit in cents (e.g., 1000 for $10.00)
 *                 example: 1000
 *               currency:
 *                 type: string
 *                 description: Currency code (e.g., USD)
 *                 example: USD
 *                 default: USD
 *             required: [amount, currency]
 *     responses:
 *       200:
 *         description: Payment intent created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indicates if the request was successful
 *                 paymentIntent:
 *                   type: object
 *                   properties:
 *                     paymentIntentId:
 *                       type: string
 *                       description: Unique ID of the payment intent
 *                     clientSecret:
 *                       type: string
 *                       description: Client secret for confirming the payment
 *                     status:
 *                       type: string
 *                       description: Current status of the payment intent
 *               example:
 *                 success: true
 *                 paymentIntent:
 *                   paymentIntentId: pi_xxx
 *                   clientSecret: pi_xxx_secret_xxx
 *                   status: requires_payment_method
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       msg:
 *                         type: string
 *                   description: Validation errors (if applicable)
 *               example:
 *                 error: Invalid input
 *                 errors: [{ msg: Amount must be a positive number }]
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 *               example:
 *                 error: Unauthorized
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 *               example:
 *                 error: Internal server error
 */
router.post('/stripe/deposit', tokenRequired, stripeController.createDeposit);

/**
 * @swagger
 * /api/payments/stripe/withdraw:
 *   post:
 *     summary: Initiate a fiat withdrawal
 *     description: Initiates a Stripe payout for withdrawing fiat currency (e.g., USD) to a bank account or payment method.
 *     tags: [Payments]
 *     security:
 *       - elentisAccessToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Amount to withdraw in cents (e.g., 5000 for $50.00)
 *                 example: 5000
 *               currency:
 *                 type: string
 *                 description: Currency code (e.g., USD)
 *                 example: USD
 *                 default: USD
 *               destination:
 *                 type: string
 *                 description: Bank account ID or payment method ID for withdrawal
 *                 example: ba_xxx
 *             required: [amount, currency, destination]
 *     responses:
 *       200:
 *         description: Withdrawal initiated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indicates if the request was successful
 *                 payout:
 *                   type: object
 *                   properties:
 *                     payoutId:
 *                       type: string
 *                       description: Unique ID of the payout
 *                     status:
 *                       type: string
 *                       description: Current status of the payout
 *                     amount:
 *                       type: number
 *                       description: Amount withdrawn in cents
 *               example:
 *                 success: true
 *                 payout:
 *                   payoutId: po_xxx
 *                   status: pending
 *                   amount: 5000
 *       400:
 *         description: Invalid input or insufficient balance
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       msg:
 *                         type: string
 *                   description: Validation errors (if applicable)
 *               example:
 *                 error: Invalid input
 *                 errors: [{ msg: Insufficient balance }]
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 *               example:
 *                 error: Unauthorized
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 *               example:
 *                 error: Internal server error
 */
router.post('/stripe/withdraw', tokenRequired, stripeController.createWithdrawal);

/**
 * @swagger
 * /api/payments/stripe/webhook:
 *   post:
 *     summary: Handle Stripe webhook events
 *     description: Processes Stripe webhook events for payment intents and payouts, updating transaction status.
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 description: Unique event ID
 *                 example: evt_xxx
 *               object:
 *                 type: string
 *                 description: Object type
 *                 example: event
 *               type:
 *                 type: string
 *                 description: Event type (e.g., payment_intent.succeeded)
 *                 example: payment_intent.succeeded
 *               data:
 *                 type: object
 *                 description: Event data
 *                 properties:
 *                   object:
 *                     type: object
 *                     description: Payment intent or payout object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: Object ID
 *                         example: pi_xxx
 *                       status:
 *                         type: string
 *                         description: Object status
 *                         example: succeeded
 *                       metadata:
 *                         type: object
 *                         description: Metadata containing user ID
 *                         properties:
 *                           userId:
 *                             type: string
 *                             description: User ID
 *                             example: 67123abc456def7890abcdee
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 received:
 *                   type: boolean
 *                   description: Indicates if the webhook was received
 *                 paymentIntentId:
 *                   type: string
 *                   description: ID of the payment intent (if applicable)
 *                 status:
 *                   type: string
 *                   description: Status of the payment intent or payout
 *               example:
 *                 received: true
 *                 paymentIntentId: pi_xxx
 *                 status: succeeded
 *       400:
 *         description: Invalid webhook signature or data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 *               example:
 *                 error: Invalid webhook signature
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 *               example:
 *                 error: Internal server error
 */
router.post('/stripe/webhook', express.raw({ type: 'application/json' }), stripeController.handleWebhook);

/**
 * @swagger
 * /api/payments/ccpayment/deposit:
 *   post:
 *     summary: Generate a crypto deposit address
 *     description: Generates a deposit address for a specified cryptocurrency and blockchain network using CCPayment.
 *     tags: [Payments]
 *     security:
 *       - elentisAccessToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               coinId:
 *                 type: string
 *                 description: Coin identifier (e.g., 1280 for USDT)
 *                 example: 1280
 *                 default: 1280
 *               chain:
 *                 type: string
 *                 description: Blockchain network (e.g., TRX)
 *                 example: TRX
 *                 default: TRX
 *             required: [coinId]
 *     responses:
 *       200:
 *         description: Deposit address created or retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indicates if the request was successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     address:
 *                       type: string
 *                       description: Deposit address
 *                     memo:
 *                       type: string
 *                       description: Optional memo for the address
 *                     chain:
 *                       type: string
 *                       description: Blockchain network
 *               example:
 *                 success: true
 *                 data:
 *                   address: T...
 *                   memo: ""
 *                   chain: TRX
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       msg:
 *                         type: string
 *                   description: Validation errors (if applicable)
 *               example:
 *                 error: Invalid input
 *                 errors: [{ msg: Coin ID is required }]
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 *               example:
 *                 error: Unauthorized
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 *               example:
 *                 error: Internal server error
 */
router.post(
  '/ccpayment/deposit',
  tokenRequired,
  [check('coinId').notEmpty().withMessage('Coin ID is required')],
  ccpaymentController.generateDepositAddress
);

/**
 * @swagger
 * /api/payments/ccpayment/withdraw:
 *   post:
 *     summary: Initiate a crypto withdrawal
 *     description: Initiates a withdrawal of cryptocurrency to a specified address using CCPayment.
 *     tags: [Payments]
 *     security:
 *       - elentisAccessToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               coinId:
 *                 type: string
 *                 description: Coin identifier (e.g., 1280 for USDT)
 *                 example: 1280
 *                 default: 1280
 *               address:
 *                 type: string
 *                 description: Destination wallet address
 *                 example: T...
 *               chain:
 *                 type: string
 *                 description: Blockchain network (e.g., TRX)
 *                 example: TRX
 *                 default: TRX
 *               amount:
 *                 type: number
 *                 description: Amount to withdraw in the coin’s base unit
 *                 example: 10.5
 *               merchantPayNetworkFee:
 *                 type: boolean
 *                 description: Whether merchant pays the network fee
 *                 example: true
 *                 default: true
 *               memo:
 *                 type: string
 *                 description: Optional memo for the transaction
 *                 example: ""
 *             required: [coinId, address, chain, amount]
 *     responses:
 *       200:
 *         description: Withdrawal initiated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indicates if the request was successful
 *                 message:
 *                   type: string
 *                   description: Success message
 *                 data:
 *                   type: object
 *                   description: CCPayment withdrawal response
 *               example:
 *                 success: true
 *                 message: Withdrawal applied successfully
 *                 data: {}
 *       400:
 *         description: Invalid input or insufficient balance
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       msg:
 *                         type: string
 *                   description: Validation errors (if applicable)
 *               example:
 *                 error: Invalid input
 *                 errors: [{ msg: Amount must be greater than 0 }]
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 *               example:
 *                 error: Unauthorized
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 *               example:
 *                 error: Internal server error
 */
router.post(
  '/ccpayment/withdraw',
  tokenRequired,
  [
    check('coinId').notEmpty().withMessage('Coin ID is required'),
    check('address').notEmpty().withMessage('Address is required'),
    check('chain').notEmpty().withMessage('Chain is required'),
    check('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),
  ],
  ccpaymentController.withdrawHandler
);

/**
 * @swagger
 * /api/payments/ccpayment/history:
 *   get:
 *     summary: Retrieve crypto transaction history
 *     description: Retrieves the user's cryptocurrency deposit and withdrawal history from the CryptoTrxHistory model.
 *     tags: [Payments]
 *     security:
 *       - elentisAccessToken: []
 *     responses:
 *       200:
 *         description: Transaction history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: boolean
 *                   description: Indicates if the request was successful
 *                 message:
 *                   type: string
 *                   description: Success message
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       user:
 *                         type: string
 *                         description: User ID
 *                         example: 67123abc456def7890abcdee
 *                       coinId:
 *                         type: string
 *                         description: Coin identifier
 *                         example: 1280
 *                       coinName:
 *                         type: string
 *                         description: Coin name
 *                         example: USDT
 *                       amount:
 *                         type: number
 *                         description: Transaction amount in smallest units
 *                         example: 6978410
 *                       chain:
 *                         type: string
 *                         description: Blockchain network
 *                         example: TRX
 *                       memo:
 *                         type: string
 *                         description: Optional memo
 *                         example: ""
 *                       orderId:
 *                         type: string
 *                         description: Order ID for withdrawals
 *                         example: 67123abc456def7890abcdee-uuid
 *                       fee:
 *                         type: number
 *                         description: Withdrawal fee in smallest units
 *                         example: 100000
 *                       status:
 *                         type: string
 *                         description: Transaction status
 *                         example: completed
 *                       recordId:
 *                         type: string
 *                         description: Record ID for deposits
 *                         example: 20250321034441254643830061580288
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         description: Transaction timestamp
 *                         example: 2025-09-19T20:28:00Z
 *               example:
 *                 status: true
 *                 message: User deposits and withdrawals retrieved successfully
 *                 data:
 *                   - user: 67123abc456def7890abcdee
 *                     coinId: 1280
 *                     coinName: USDT
 *                     amount: 6978410
 *                     chain: TRX
 *                     memo: ""
 *                     recordId: 20250321034441254643830061580288
 *                     type: deposit
 *                     status: completed
 *                     createdAt: 2025-09-19T20:28:00Z
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 *               example:
 *                 error: Unauthorized
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 *               example:
 *                 error: Internal server error
 */
router.get('/ccpayment/history', tokenRequired, ccpaymentController.getCryptoTrxHistory);

/**
 * @swagger
 * /api/payments/ccpayment/deposit/webhook:
 *   post:
 *     summary: Handle CCPayment deposit webhook events
 *     description: Processes CCPayment webhook events for cryptocurrency deposits, updating user balances and transaction records.
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 description: Webhook event type
 *                 example: DirectDeposit
 *               msg:
 *                 type: object
 *                 properties:
 *                   recordId:
 *                     type: string
 *                     description: Unique record ID
 *                     example: 20250321034441254643830061580288
 *                   referenceId:
 *                     type: string
 *                     description: Reference ID containing user ID
 *                     example: 67123abc456def7890abcdee-uuid
 *                   coinId:
 *                     type: integer
 *                     description: Coin identifier
 *                     example: 1280
 *                   coinSymbol:
 *                     type: string
 *                     description: Coin symbol
 *                     example: USDT
 *                   status:
 *                     type: string
 *                     description: Transaction status
 *                     example: Success
 *                   amount:
 *                     type: string
 *                     description: Deposit amount
 *                     example: 6.97841
 *                   chain:
 *                     type: string
 *                     description: Blockchain network
 *                     example: TRX
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   description: Success message
 *               example:
 *                 msg: success
 *       400:
 *         description: Invalid webhook data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 *               example:
 *                 error: Invalid webhook data
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 *               example:
 *                 error: Internal server error
 */
router.post('/ccpayment/deposit/webhook', express.raw({ type: 'application/json' }), ccpaymentController.handleDepositWebhook);

/**
 * @swagger
 * /api/payments/ccpayment/withdraw/webhook:
 *   post:
 *     summary: Handle CCPayment withdrawal webhook events
 *     description: Processes CCPayment webhook events for cryptocurrency withdrawals, updating transaction status.
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 description: Webhook event type
 *                 example: ApiWithdrawal
 *               msg:
 *                 type: object
 *                 properties:
 *                   recordId:
 *                     type: string
 *                     description: Unique record ID
 *                     example: 20250321034441254643830061580288
 *                   orderId:
 *                     type: string
 *                     description: Unique order ID
 *                     example: 67123abc456def7890abcdee-uuid
 *                   coinId:
 *                     type: integer
 *                     description: Coin identifier
 *                     example: 1280
 *                   coinSymbol:
 *                     type: string
 *                     description: Coin symbol
 *                     example: USDT
 *                   status:
 *                     type: string
 *                     description: Transaction status
 *                     example: Success
 *                   amount:
 *                     type: string
 *                     description: Withdrawal amount
 *                     example: 10.0
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   description: Success message
 *               example:
 *                 msg: success
 *       400:
 *         description: Invalid webhook data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 *               example:
 *                 error: Invalid webhook data
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 *               example:
 *                 error: Internal server error
 */
router.post('/ccpayment/withdraw/webhook', express.raw({ type: 'application/json' }), ccpaymentController.handleWithdrawWebhook);

module.exports= router;