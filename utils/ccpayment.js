const https = require('https');
const crypto = require('crypto');
const axios = require('axios');
require('dotenv').config();
const mongoose = require('mongoose');
const { Users } = require('../models/users');
const CryptoTrxHistory = require('../models/cryptoTrxHistory');
// const SwapFee = require('../model/swapFee');
// const { sendPushNotification } = require('./ExpoNotify');

class CCPaymentService {
  constructor() {
    this.appId = process.env.CCPAYMENT_APP_ID;
    this.appSecret = process.env.CCPAYMENT_APP_SECRET;
    if (!this.appId || !this.appSecret) {
      throw new Error('CCPAYMENT_APP_ID and CCPAYMENT_APP_SECRET must be set in environment variables');
    }
  }

  /**
   * Checks if an error is a timeout error
   * @param {Error} err - Error object
   * @returns {boolean} - True if error is a timeout
   */
  #isTimeoutError(err) {
    return err.code === 'ETIMEDOUT';
  }

  /**
   * Makes a request to the CCPayment API with retry logic for timeouts
   * @param {string} path - API endpoint URL
   * @param {object|string} args - Request body arguments
   * @param {number} [retryCount=3] - Number of retry attempts for timeouts
   * @returns {Promise<object>} - Parsed API response
   */
  async #makeRequest(path, args = '', retryCount = 3) {
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const signText = this.appId + timestamp + (args ? args : '');
      const sign = crypto
        .createHmac('sha256', this.appSecret)
        .update(signText)
        .digest('hex');

      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Appid': this.appId,
          'Sign': sign,
          'Timestamp': timestamp.toString(),
        },
        timeout: 15000,
      };

      return new Promise((resolve, reject) => {
        const req = https.request(path, options, (res) => {
          let respData = '';

          res.on('data', (chunk) => {
            respData += chunk;
          });

          res.on('end', () => {
            try {
              const parsed = JSON.parse(respData);
              resolve(parsed);
            } catch (error) {
              reject(new Error(`Failed to parse API response: ${error.message}`));
            }
          });
        });

        req.on('error', (err) => {
          if (this.#isTimeoutError(err) && retryCount > 0) {
            setTimeout(() => {
              resolve(this.#makeRequest(path, args, retryCount - 1));
            }, 200);
          } else {
            reject(new Error(`API request failed: ${err.message}`));
          }
        });

        if (args) req.write(args);
        req.end();
      });
    } catch (error) {
      throw new Error(`Request setup failed: ${error.message}`);
    }
  }

  /**
   * Fetches the list of supported coins from CCPayment API
   * @returns {Promise<object>} - API response with coin list
   */
  async getCoinList() {
    return this.#makeRequest('https://ccpayment.com/ccpayment/v2/getCoinList');
  }

  /**
   * Fetches the exchange rate for USDT
   * @returns {Promise<object>} - Exchange rate data
   */
  async getExchangeRate() {
    try {
      const response = await axios.get('https://api.exchangerate-api.com/v4/latest/USDT');
      console.log('NGN Exchange Rate:', response.data.rates.NGN);
      return response.data;
    } catch (error) {
      console.error('Error fetching exchange rate:', error.message);
      throw new Error(`Failed to fetch exchange rate: ${error.message}`);
    }
  }

  /**
   * Fetches Naira to USD exchange rate
   * @returns {Promise<object>} - Exchange rate data
   */
  async getNairaInUsd() {
    try {
      const response = await axios.get('https://api.exchangerate-api.com/v4/latest/NGN');
      return response.data;
    } catch (error) {
      console.error('Error fetching NGN to USD rate:', error);
      throw new Error(`Failed to fetch Naira to USD rate: ${error.message}`);
    }
  }

  /**
   * Fetches the list of supported fiat currencies from CCPayment API
   * @returns {Promise<object>} - API response with fiat list
   */
  async getFiatList() {
    return this.#makeRequest('https://ccpayment.com/ccpayment/v2/getFiatList');
  }

  /**
   * Checks if a withdrawal address is valid for a given chain
   * @param {string} chain - Blockchain network (e.g., 'POLYGON')
   * @param {string} address - Wallet address to validate
   * @returns {Promise<object>} - API response with validation result
   */
  async checkWithdrawalAddressValidity(chain, address) {
    if (!chain || !address) {
      throw new Error('Chain and address are required');
    }
    const args = JSON.stringify({ chain, address });
    return this.#makeRequest('https://ccpayment.com/ccpayment/v2/checkWithdrawalAddressValidity', args);
  }

  /**
   * Gets the withdrawal fee for a given coin and chain
   * @param {number} coinId - ID of the coin
   * @param {string} chain - Blockchain network (e.g., 'POLYGON')
   * @returns {Promise<object>} - API response with fee details
   */
  async getWithdrawFee(coinId, chain) {
    if (!coinId || !chain) {
      throw new Error('Coin ID and chain are required');
    }
    const args = JSON.stringify({ coinId, chain });
    return this.#makeRequest('https://ccpayment.com/ccpayment/v2/getWithdrawFee', args);
  }

  /**
   * Gets list of supported blockchain chains
   * @param {string[]} chains - Array of chain names (e.g., ['ETH', 'POLYGON'])
   * @returns {Promise<object>} - API response with chain list
   */
  async getChainList(chains) {
    if (!Array.isArray(chains) || chains.length === 0) {
      throw new Error('Chains must be a non-empty array');
    }
    const args = JSON.stringify({ chains });
    return this.#makeRequest('https://ccpayment.com/ccpayment/v2/getChainList', args);
  }

  /**
   * Gets app coin asset list
   * @returns {Promise<object>} - API response with asset list
   */
  async getAppCoinAssetList() {
    return this.#makeRequest('https://ccpayment.com/ccpayment/v2/getAppCoinAssetList');
  }

  /**
   * Gets details for a specific app coin asset
   * @param {number} coinId - ID of the coin
   * @returns {Promise<object>} - API response with asset details
   */
  async getAppCoinAsset(coinId) {
    if (!coinId) {
      throw new Error('Coin ID is required');
    }
    const args = JSON.stringify({ coinId });
    return this.#makeRequest('https://ccpayment.com/ccpayment/v2/getAppCoinAsset', args);
  }

  /**
   * Applies for app withdrawal to a blockchain network
   * @param {object} withdrawalDetails - Withdrawal details (coinId, address, orderId, chain, amount, merchantPayNetworkFee, memo)
   * @returns {Promise<object>} - API response with withdrawal details
   */
  async applyAppWithdrawToNetwork(withdrawalDetails) {
    const { coinId, address, orderId, chain, amount, merchantPayNetworkFee, memo } = withdrawalDetails;
    if (!coinId || !address || !orderId || !chain || !amount) {
      throw new Error('Coin ID, address, order ID, chain, and amount are required');
    }
    const args = JSON.stringify({
      coinId,
      address,
      orderId,
      chain,
      amount,
      merchantPayNetworkFee,
      memo
    });
    return this.#makeRequest('https://ccpayment.com/ccpayment/v2/applyAppWithdrawToNetwork', args);
  }

  /**
   * Applies for app withdrawal to a Cwallet user
   * @param {object} withdrawalDetails - Withdrawal details (coinId, cwalletUser, orderId, amount)
   * @returns {Promise<object>} - API response with withdrawal details
   */
  async applyAppWithdrawToCwallet(withdrawalDetails) {
    const { coinId, cwalletUser, orderId, amount } = withdrawalDetails;
    if (!coinId || !cwalletUser || !orderId || !amount) {
      throw new Error('Coin ID, Cwallet user, order ID, and amount are required');
    }
    const args = JSON.stringify({
      coinId,
      cwalletUser,
      orderId,
      amount
    });
    return this.#makeRequest('https://ccpayment.com/ccpayment/v2/applyAppWithdrawToCwallet', args);
  }

  /**
   * Gets withdrawal record details
   * @param {string} orderId - Order ID of the withdrawal
   * @returns {Promise<object>} - API response with withdrawal record
   */
  async getWithdrawRecord(orderId) {
    if (!orderId) {
      throw new Error('Order ID is required');
    }
    const args = JSON.stringify({ orderId });
    return this.#makeRequest('https://ccpayment.com/ccpayment/v2/getAppWithdrawRecord', args);
  }

  /**
   * Gets app deposit record details
   * @param {string} recordId - ID of the deposit record
   * @returns {Promise<object>} - API response with deposit record
   */
  async getAppDepositRecord(recordId) {
    if (!recordId) {
      throw new Error('Record ID is required');
    }
    const args = JSON.stringify({ recordId });
    return this.#makeRequest('https://ccpayment.com/ccpayment/v2/getAppDepositRecord', args);
  }

  /**
   * Gets list of app deposit records
   * @returns {Promise<object>} - API response with deposit record list
   */
  async getAppDepositRecordList() {
    return this.#makeRequest('https://ccpayment.com/ccpayment/v2/getAppDepositRecordList');
  }

  /**
   * Gets or creates an app deposit address
   * @param {string} chain - Blockchain network (e.g., 'POLYGON')
   * @param {string} referenceId - Reference ID for the deposit address
   * @returns {Promise<object>} - API response with deposit address
   */
  async getOrCreateAppDepositAddress(chain, referenceId) {
    if (!chain || !referenceId) {
      throw new Error('Chain and reference ID are required');
    }
    const args = JSON.stringify({ referenceId, chain });
    return this.#makeRequest('https://ccpayment.com/ccpayment/v2/getOrCreateAppDepositAddress', args);
  }

  /**
   * Updates the crypto balance for a user
   * @param {string} userId - MongoDB user ID
   * @param {number} coinId - Coin ID
   * @param {string} coinName - Coin name
   * @param {number} amount - Amount to add/subtract (in smallest units)
   * @param {string} recordId - Transaction record ID
   * @param {string} logoUrl - Coin logo URL
   * @returns {Promise<object>} - Updated user document or false if already processed
   */
  async updateBalance(userId, coinId, coinName, amount, recordId, logoUrl) {
    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID');
      }
      if (!coinId || !coinName || !amount || !recordId) {
        throw new Error('Coin ID, coin name, amount, and record ID are required');
      }

      const existingTrx = await CryptoTrxHistory.findOne({ user: userId, recordId });
      if (existingTrx) {
        console.log('Transaction already processed for this record.');
        return false;
      }

      const user = await Users.findByIdAndUpdate(
        userId,
        { $inc: { cryptoBalance: amount } },
        { new: true }
      );

      const trx = new CryptoTrxHistory({
        user: userId,
        coinId,
        coinName,
        amount,
        type: amount > 0 ? 'deposit' : 'withdrawal',
        status: 'completed',
        recordId
      });
      await trx.save();

    //   if (amount > 0 && user?.expoPushToken) {
    //     await sendPushNotification(
    //       user.expoPushToken,
    //       'Crypto Deposit',
    //       `💰 Your deposit of ${amount / 10 ** 6} ${coinName} was successful!`
    //     );
    //   }

      return user;
    } catch (error) {
      console.error('Error updating balance:', error);
      throw new Error(`Failed to update balance: ${error.message}`);
    }
  }

  /**
   * Updates crypto balance without tracking record ID
   * @param {string} userId - MongoDB user ID
   * @param {number} coinId - Coin ID
   * @param {string} coinName - Coin name
   * @param {number} amount - Amount to add/subtract (in smallest units)
   * @param {string} logoUrl - Coin logo URL
   * @returns {Promise<object>} - Updated user document
   */
  async updateBalanceNoTrack(userId, coinId, coinName, amount, logoUrl) {
    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID');
      }
      if (!coinId || !coinName || !amount) {
        throw new Error('Coin ID, coin name, and amount are required');
      }

      const user = await Users.findByIdAndUpdate(
        userId,
        { $inc: { cryptoBalance: amount } },
        { new: true }
      );

      const trx = new CryptoTrxHistory({
        user: userId,
        coinId,
        coinName,
        amount,
        type: amount > 0 ? 'deposit' : 'withdrawal',
        status: 'completed',
        recordId: `NTR_${Date.now()}` // Generate a placeholder recordId
      });
      await trx.save();

      return user;
    } catch (error) {
      console.error('Error updating balance (no track):', error);
      throw new Error(`Failed to update balance: ${error.message}`);
    }
  }

  /**
   * Retrieves crypto balance for a user
   * @param {string} userId - MongoDB user ID
   * @returns {Promise<number>} - Users's crypto balance
   */
  async getBalance(userId) {
    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID');
      }
      const user = await Users.findById(userId).select('cryptoBalance');
      return user ? user.cryptoBalance : 0;
    } catch (error) {
      console.error('Error retrieving balance:', error);
      throw new Error(`Failed to retrieve balance: ${error.message}`);
    }
  }

  /**
   * Retrieves all balances for a user (crypto and fiat)
   * @param {string} userId - MongoDB user ID
   * @returns {Promise<object>} - Users's balances
   */
  async getAllBalances(userId) {
    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID');
      }
      const user = await Users.findById(userId).select('cryptoBalance fiatBalance');
      return user ? { cryptoBalance: user.cryptoBalance, fiatBalance: user.fiatBalance } : { cryptoBalance: 0, fiatBalance: 0 };
    } catch (error) {
      console.error('Error retrieving all balances:', error);
      throw new Error(`Failed to retrieve balances: ${error.message}`);
    }
  }

  /**
   * Calculates swap fee for a transaction
   * @param {number} amount - Transaction amount (in smallest units)
   * @returns {Promise<object>} - Fee details (platformFee, apiPaymentFee, totalFee, netAmount)
   */
  async calculateSwapFee(amount) {
    try {
      if (typeof amount !== 'number' || amount <= 0) {
        throw new Error('Amount must be a positive number');
      }
      const feeStructure = await SwapFee.findOne();
      if (!feeStructure) {
        throw new Error('Swap fee structure not found');
      }
      const platformFee = (amount * feeStructure.platformFeePercentage) / 100;
      const apiPaymentFee = (amount * feeStructure.apiPaymentFeePercentage) / 100;
      const totalFee = platformFee + apiPaymentFee;
      return {
        platformFee,
        apiPaymentFee,
        totalFee,
        netAmount: amount - totalFee
      };
    } catch (error) {
      console.error('Error calculating swap fee:', error);
      throw new Error(`Failed to calculate swap fee: ${error.message}`);
    }
  }

  /**
   * Extracts MongoDB ID from a string
   * @param {string} str - Input string containing MongoDB ID
   * @returns {string} - Extracted MongoDB ID
   */
  extractMongoId(str) {
    if (typeof str !== 'string' || str.length < 24) {
      throw new Error('Invalid input string for MongoDB ID');
    }
    return str.substring(0, 24);
  }

  /**
   * Handles CCPayment webhook events
   * @param {Object} req - Express request object
   * @returns {Promise<object>} - Webhook processing result
   */
  async handleWebhook(req) {
    try {
      const signature = req.headers['sign'];
      const timestamp = req.headers['timestamp'];
      const body = JSON.stringify(req.body);
      const expectedSign = crypto
        .createHmac('sha256', this.appSecret)
        .update(this.appId + timestamp + body)
        .digest('hex');

      if (signature !== expectedSign) {
        throw new Error('Invalid webhook signature');
      }

      const event = req.body;
      if (event.eventType === 'deposit' && event.status === 'success') {
        const { recordId, coinId, coinName, amount, userId, logoUrl } = event;
        if (!mongoose.Types.ObjectId.isValid(userId)) {
          throw new Error('Invalid user ID in webhook');
        }

        return await this.updateBalance(userId, coinId, coinName, amount, recordId, logoUrl);
      }

      return { received: true, message: 'Event received but not handled' };
    } catch (error) {
      console.error('Webhook error:', error);
      throw new Error(`Webhook error: ${error.message}`);
    }
  }
}

module.exports = CCPaymentService;