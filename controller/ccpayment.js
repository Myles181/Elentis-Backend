const { Users } = require('../models/users');
const CryptoTrxHistory = require('../models/cryptoTrxHistory');
const FiatTrxHistory = require('../models/fiatTrxHistory');
const { validationResult } = require('express-validator');
const { getPlatformCharge } = require('../utils/helpers');
const CCPayment = require('../utils/ccpayment');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

// Initialize CCPayment
const ccpayment = new CCPayment({
    apiKey: process.env.CCPAYMENT_API_KEY,
    apiSecret: process.env.CCPAYMENT_API_SECRET,
    // testMode: process.env.CCPAYMENT_TEST_MODE === 'true' // Convert to boolean
});


// Deposit crypto funds using CCPayment
const generateDepositAddress = async (req, res) => {
    const { user } = req;
    const { chain="TRX" } = req.body;
    
    const referenceId = `${user._id.toString()}${uuidv4()}`;
    try {
        // Create deposit address via CCPayment
        const response = await ccpayment.getOrCreateAppDepositAddress(
            chain,
            referenceId
        );
        console.log("Response:", response);

        const { code, msg, data } = JSON.parse(response);
        if (code === 1000 && msg === "success") {
            const { address, memo } = data;
            return res.json({ success: true, data: { address, memo, chain } });
        }

        return res.json({ success: false, error: "Failed" });
    } catch (error) {
        console.log("Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
}

const withdrawHandler = async (req, res) => {
    const user = req.user;
    const { address, amount, chain="TRX" } = req.body;

    try {
            
        // Check charge
        const platformCharges = await getPlatformCharge("withdrawal_crypto");
        let withdrawalFee = platformCharges ? platformCharges.fee : 0;
        withdrawalFee = amount * withdrawalFee;

        // Check user balance
        const totalAmount = amount + withdrawalFee;
        if (user.cryptoBalance < totalAmount) return res.status(400).json({ error: "Insufficient Funds" });

        // Prepare withdrawal details
        const orderId = `${user._id.toString()}${uuidv4()}`;
        const withdrawalDetails = {
            coinId: "1280",
            address,
            orderId,
            chain,
            type: "withdrawal",
            amount: amount.toString(),
            merchantPayNetworkFee: true,
            memo: '' // Optional, if needed
        };

        const response = await ccpayment.applyAppWithdrawToNetwork(withdrawalDetails);

        const { code, msg, data } = JSON.parse(response);
        if (code === 10000 && msg === "success") {
            // Update balance
            user.cryptoBalance -= totalAmount;
            await user.save();

            // Record the withdrawal history
            const withdrawalHistory = await CryptoTrxHistory({
                user: user._id,
                coinId: "1280",
                coinName: "USDT",
                amount,
                chain,
                memo: "",
                orderId,
                fee: withdrawalFee,
                status: "processing"
            });

            await withdrawalHistory.save();
            return res.status(200).json({
                status: true,
                message: "Withdrawal applied successful",
                data: data
            });
        } else {
            return res.status(400).json({
                status: false,
                message: "Failed to apply withdrawal",
                error: msg
            });
        }
    } catch (error) {
        console.log("error::", error);
        return res.status(500).json({
            status: false,
            message: "Internal server error",
            error: error.message
        });
    }
}

const getCryptoTrxHistory = async (req, res) => {
    try {
        const user = req.user;
        const transactionHistory = await CryptoTrxHistory.find({ user: user._id});

        return res.status(200).json({
            status: true,
            message: "User deposits and withdrawals retrieved successfully",
            data: transactionHistory
        });
    } catch (error) {
        console.error("Error in getUserDeposits:", error);
        return res.status(500).json({
            status: false,
            message: "Internal server error",
        });
    }
}

async function handleDepositWebhook(req, res) {
    try {

        console.log("------------------")
        console.log(req.body)
        console.log("------------------")

        // {
        //     type: 'DirectDeposit',
        //         msg: {
        //         recordId: '20250321034441254643830061580288',
        //             referenceId: '67c34bb3c10deb8afb0daf92c9fb5440-72ed-4b6e-bda8-72473375b328',
        //                 coinId: 1280,
        //                     coinSymbol: 'USDT',
        //     status: 'Success',
        //     isFlaggedAsRisky: false
        // }


        const userId = extractMongoId(req.body.msg.referenceId);
        const recordId = req.body.msg.recordId;
        const status = req.body.msg.status;

        if (status !== "Success") {
            // Handle failed deposit
            // return res.status()
            console.log("Deposit Error");
            res.json({ msg: "success" });
        }
            


        const result = await getAppDepositRecord(recordId)


        // sample response from the result-----------------

        // { 
        // "code": 10000, 
        // "msg": "success", 
        // "data": 
        // { "record": 
        //  { "recordId": "20250321040839254649861445558272", 
        //     "referenceId": "67c34bb3c10deb8afb0daf920ed4dcea-c8a6-40dc-a943-ef3931d7720e", 
        //     "coinId": 1280, 
        //     "coinSymbol": "USDT", 
        //     "chain": "TRX", 
        //     "contract": "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t", 
        //     "coinUSDPrice": "1", 
        //     "fromAddress": "TEkPS823QiLFgb4GeK1h1P77SpSzvdYqzA", 
        //     "toAddress": "TDTFjqSUmGKHBVPo12J4ozCVhcgRUdNQRW", 
        //     "toMemo": "", 
        //     "amount": "6.97841", 
        //     "serviceFee": "0.034893", 
        //     "txId": "2d8b1dc99157b93cf8f835128851a0b9f78144f769db47fcc3c39e73cf2775de", 
        //     "txIndex": 200000, "status": "Success", "arrivedAt": 1742530119, "isFlaggedAsRisky": false } } }

        const { code, msg, data } = JSON.parse(result)

        const userDeposit = data.record;
g
        const coinId = userDeposit.coinId;
        const coinName = userDeposit.coinSymbol;
        const amount = userDeposit.amount;

        // await updateBalance(userId, coinId, coinName, amount, recordId);
        const depositUser = await Users.findById(userId);
        if (depositUser) {
            // Update the  balance
            depositUser.cryptoBalance += amount;
            await depositUser.save();

            // Save transaction
            await CryptoTrxHistory.create({
                user: depositUser._id,
                coinId,
                coinName,
                amount,
                type: "deposit",
                status: "completed",
                recordId,
                chain
            });
        }

        // Respond to the webhook
        res.json({ msg: "success" });
    } catch (error) {
        console.error("Deposit webhook error:", error);
        return res.status(500).json({
            status: false,
            message: "Internal server error",
        });
    }
}

async function handleWithdrawWebhook(req, res) {
    try {

        // console.log("------------------")
        // console.log(req.body)
        // console.log("------------------")


        // {
        //        type: 'ApiWithdrawal',
        //        msg: {
        //          recordId: '20250331161641258456955022073856w',
        //          orderId: '67cb9f1bef18eee65e757818da09c047-f03e-430e-909c-4ac093e59600',
        //          coinId: 1280,
        //          coinSymbol: 'USDT',
        //          status: 'Success'
        //        }
        //      }

        if (req?.body?.type === "ApiWithdrawal" && req?.body?.msg?.status === "Success") {
            const result = await CryptoTrxHistory.findOneAndUpdate({
                orderId: req.body.msg.orderId
            }, { status: "successful" })

            // Send withdrawal success notification
            // if (result) {
            //     const { sendPushNotification } = require('../utils/ExpoNotify');
            //     const User = require('../models/users');
                
            //     const user = await User.findById(result.user);
            //     if (user?.expoPushToken) {
            //         console.log('Sending withdrawal success notification to:', user.expoPushToken);
            //         try {
            //             await sendPushNotification(
            //                 user.expoPushToken, 
            //                 'Withdrawal Successful', 
            //                 `✅ Withdrawal of ${result.amount} ${result.coinSymbol} completed successfully!`
            //             );
            //             console.log('Withdrawal success notification sent successfully');
            //         } catch (notifError) {
            //             console.error('Error sending withdrawal success notification:', notifError);
            //         }
            //     } else {
            //         console.log('No expoPushToken found for user:', result.user);
            //     }
            // }

            // console.log("---- result",result)
        } else if (req?.body?.type === "ApiWithdrawal" && req?.body?.msg?.status === "Failed") {
            // Handle failed withdrawal
            const result = await CryptoTrxHistory.findOneAndUpdate({
                orderId: req.body.msg.orderId
            }, { status: "failed" })

            // Send withdrawal failed notification
            // if (result) {
            //     const { sendPushNotification } = require('../utils/ExpoNotify');
            //     const User = require('../models/users');
                
            //     const user = await User.findById(result.user);
            //     if (user?.expoPushToken) {
            //         console.log('Sending withdrawal failed notification to:', user.expoPushToken);
            //         try {
            //             await sendPushNotification(
            //                 user.expoPushToken, 
            //                 'Withdrawal Failed', 
            //                 `⚠ Your withdrawal request failed. Please review the details or try again.`
            //             );
            //             console.log('Withdrawal failed notification sent successfully');
            //         } catch (notifError) {
            //             console.error('Error sending withdrawal failed notification:', notifError);
            //         }
            //     } else {
            //         console.log('No expoPushToken found for user:', result.user);
            //     }
            // }
        }

        // Respond to the webhook
        res.json({ msg: "success" });
    } catch (error) {
        console.error("Withdrawal webhook error:", error);
        
        // Try to send error notification if possible
        return res.status(500).json({
            status: false,
            message: "Internal server error",
        });
    }
}


module.exports = { handleWithdrawWebhook, handleDepositWebhook, getCryptoTrxHistory, generateDepositAddress, withdrawHandler };
