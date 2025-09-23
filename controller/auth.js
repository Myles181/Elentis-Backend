const { Users } = require('../models/users');
const { OTP } = require('../models/otp');
const { Reset_OTP } = require('../models/resetOtp');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const requestIp = require('request-ip');
const { createOrUpdateOTP, createOrUpdateResetOTP, generateReferralCdoe } = require('../utils/helpers');
let { Mail } = require("../middleware/mails");
let mail = new Mail();
const { validationResult } = require('express-validator');
const axios = require('axios');

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;



// Signup endpoint
async function Signup(req, res) {
    // Run the validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, skills, interest, referBy="" } = req.body;

    try {
        // Check if the user already exists
        let lowerCaseEmail = email.toLowerCase().trim()
        const users = await Users.findOne({ email: lowerCaseEmail });

        if (users) return res.status(400).json({ message: 'User already exists' });

        // Hash password
        let salt = await bcrypt.genSalt(10);
        let hashedPassword = await bcrypt.hash(password, salt);

        // Get the user ip address
        const ipAddress = requestIp.getClientIp(req);

        const refCode = await generateReferralCdoe();

        // Create user
        await Users.create({
            name: name,
            password: hashedPassword,
            email: lowerCaseEmail,
            skills: skills || [],
            interest: interest || "",
            ipAddress: ipAddress,
            referBy: referBy,
            refCode: refCode
        });

        // Send Email Validation Otp
        const newOtp = await createOrUpdateOTP(lowerCaseEmail);

        await mail.sendOTPEmail({ name, email: lowerCaseEmail, otp: newOtp });

        return res.status(200).json({
            success: true,
            message: 'OTP sent to your email. Please verify to complete registration.',
            email: lowerCaseEmail
        });

    } catch (error) {
        console.log("Error: ", error);
        return res.status(500).json({
            status: false,
            message: "Internal server error",
        });
    }
}


const verifyOTP = async (req, res) => {
    // Run the validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    let { email, otp } = req.body;

    try {
        let otpRecord = await OTP.findOne({ email, otp });

        if (!otpRecord) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }
        else if (otpRecord.expiredAt && otpRecord.expiredAt.getTime() < Date.now()) {
            await OTP.deleteOne({ _id: otpRecord._id });
            return res.status(400).json({ message: 'Invalid OTP (expired)' });
        }

        // Update the user model
        const newUser = await Users.findOneAndUpdate(
            { email: email },
            { $set: { emailVerified: true } },
            { new: true } // returns the updated document
          );          

        // Delete the otp
        await OTP.deleteOne({ _id: otpRecord._id });

        // Send the welcoming message
        await mail.sendWelcomeMessage({ 
            email,
            name: newUser.name,
            web_base_url: process.env.WEB_BASE_URL 
        });

        return res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
            },
        });
    } catch (error) {
        console.log("*********00 error", error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

const forgotPassword = async (req, res) => {
    // Run the validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { email } = req.body;

        let lowerCaseEmail = email.toLowerCase().trim()
        const user = await Users.findOne({ email: lowerCaseEmail });

        // Check if user exists
        if (!user) return res.status(404).json({ success: false, message: 'Email Does not exist' });

        // Create OTP
        let newOtp = await createOrUpdateResetOTP(lowerCaseEmail);

        await mail.sendResetPassOTP({ name: user.name, email: lowerCaseEmail, otp: newOtp });

        // send push notification to the user for reset password email
        // if (user?.expoPushToken) {
        //     sendPushNotification(user.expoPushToken, 'Reset Password', 'You have requested to reset your password. Please use the OTP to reset your password.');
        // }

        return res.status(200).json({
            success: true,
            message: 'OTP sent to your email. Purpose is to reset password.',
            email: email
        });
    } catch (error) {
        console.log("*********00 error", error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

const resetPassword = async (req, res) => {
    // Run the validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { otp, email, newPassword } = req.body;

        let reset_otp = (await Reset_OTP.find({ email: email, otp: otp }));

        if (!reset_otp.length) return res.status(404).json({ status: false, message: 'Invalid code' });

        const current_reset_otp = reset_otp[0];

        if (!current_reset_otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }
        else if (current_reset_otp.expiredAt && current_reset_otp.expiredAt.getTime() < Date.now()) {
            await Reset_OTP.deleteOne({ _id: current_reset_otp._id });
            return res.status(400).json({ message: 'Invalid OTP (expired)' });
        }

        let salt = await bcrypt.genSalt(10);
        let hashedPassword = await bcrypt.hash(newPassword, salt);

        await Users.updateOne({ email: email }, { password: hashedPassword });

        await Reset_OTP.deleteMany({ email: email });

        return res.status(200).json({
            success: true,
            message: 'Password Successfully Updated',
            email: email
        });

    } catch (error) {
        console.log("*********00 error", error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// const changePassword = async (req, res) => {
//     try {
//         const user = req.user;
//         const { oldPassword, newPassword, sessionId, otp } = req.body;

//         // IF OTP AND SESSION ID WAS NOT PRESENT. GENERATE ONE (ELSE VERIFY)
//         if (!otp || !sessionId) {
//             let otp = generateNumericOTP()
//             const now = new Date();
//             const expiresAt = new Date(now.getTime() + 5 * 60 * 1000);

//             await mail.sendChangePassowrdOTPEmail({ email: user.email, otp: otp, createdAt: now });

//             // send push notification to the user for change password email
//             if (user?.expoPushToken) {
//                 sendPushNotification(user.expoPushToken, 'Change Password', 'You have requested to change your password. Please use the OTP to change your password and your otp is ' + otp);
//             }

//             const newSession = await ChangePasswordSession.create({
//                 user: user._id,
//                 otp: otp,
//                 expiresAt: expiresAt,
//                 isActive: true,
//                 verifyCode: false
//             });

//             return res.status(200).json({
//                 success: true,
//                 message: 'Change Password Session initiated',
//                 sessionId: newSession._id
//             });
//         } else {
//             const session = await ChangePasswordSession.findOne({
//                 _id: sessionId,
//                 isActive: true
//             });

//             const now = new Date();
//             if (!session || now > session.expiresAt) {
//                 return res.status(403).json({
//                     message: "No session found or session expired, please initiate another session"
//                 });
//             }

//             if (session.otp !== otp) {
//                 return res.status(402).json({ message: 'Invalid OTP Code' });
//             }

//             await ChangePasswordSession.findByIdAndUpdate(session._id, {
//                 verifyCode: true,
//                 isActive: false
//             });
//         }

//         if (!oldPassword || !newPassword) return res.status(400).json({ status: false, message: 'Required field missing' })

//         // Check if the user is found
//         let currentUser = await User.findById(user._id);

//         if (!currentUser) return res.status(404).json({ status: false, message: 'User not found' });

//         // Check if the old password matches
//         let isMatch = await bcrypt.compare(oldPassword, currentUser.password);

//         if (!isMatch) return res.status(406).json({ status: false, message: 'Invalid password' })


//         let salt = await bcrypt.genSalt(10);
//         let hashedPassword = await bcrypt.hash(newPassword, salt);

//         await User.findByIdAndUpdate(user._id, { password: hashedPassword }, { new: true });

//         return res.status(200).json({
//             success: true,
//             message: 'Password Successfully Updated'
//         });

//     } catch (error) {
//         console.log("*********00 error", error);
//         return res.status(500).json({ success: false, message: 'Server error' });
//     }
// };

const resendOTP = async (req, res) => {
    // Run the validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    let { email } = req.body;

    try {
        let lowerCaseEmail = email.toLowerCase().trim();
        let otpRecord = await OTP.findOne({ email: lowerCaseEmail });

        if (otpRecord) {
            await OTP.deleteOne({ _id: otpRecord._id });
        }

        // Get users email
        const user = Users.findOne({ email: lowerCaseEmail });

        // Send Email Validation Otp
        const newOtp = await createOrUpdateOTP(lowerCaseEmail);

        await mail.sendOTPEmail({ name: user.name, email: lowerCaseEmail, otp: newOtp });

        return res.status(200).json({
            success: true,
            message: 'OTP resent to your email. Please verify to complete registration.',
            email: lowerCaseEmail
        });
    } catch (error) {
        console.log("Error resending OTP:", error);
        return res.status(500).json({ message: 'Server error' });
    }
};


// const contactUs = async (req, res) => {
//     const { email, message, phoneNumber } = req.body;

//     try {
//         if (!email || !message) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Email and message are required'
//             });
//         }

//         // if (!validateEmail(email)) {
//         //     return res.status(400).json({
//         //         success: false,
//         //         message: 'Invalid email address'
//         //     });
//         // }

//         // Send email to admin
//         await mail.sendContactUsEmail({
//             userEmail: email,
//             message: message,
//             phoneNumber: phoneNumber
//         });

//         // fetch all admins
//         const admins = await admin.find({});
//         for (const admin of admins) {
//             if (admin?.expoPushToken) {
//                 sendPushNotification(admin.expoPushToken, 'Contact Us', 'A new message has been sent from ' + email);
//             }
//         }

//         return res.status(200).json({
//             success: true,
//             message: 'Your message has been sent successfully'
//         });

//     } catch (error) {
//         console.error("Error sending contact us email:", error);
//         return res.status(500).json({
//             success: false,
//             message: 'Server error'
//         });
//     }
// };


const loginUser = async (req, res) => {
    // Run the validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    let { email, password, EXPO_PUSH_TOKEN: expoPushToken } = req.body;

    try {
        // Normalize email
        const lowerCaseEmail = email.toLowerCase().trim();

        // Find user
        const user = await Users.findOne({ email: lowerCaseEmail });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check if the ip address is valid if not email user
        const ipAddress = requestIp.getClientIp(req);
        if (user.ipAddress !== ipAddress) {
            try {
                // Get location info from IP
                const response = await axios.get(`http://ip-api.com/json/${ipAddress}`);
                const geo = response.data;
        
                const location = `${geo.city}, ${geo.regionName}, ${geo.country}`;
        
                // Send warning email
                mail.loginWarning({ 
                    name: user.name,
                    email: user.email,
                    ipAddress,
                    loginTime: new Date(),
                    location
                });
            } catch (err) {
                console.error('Failed to get geolocation:', err.message);
        
                // Fallback email with "Unknown location"
                mail.loginWarning({ 
                    name: user.name,
                    email: user.email,
                    ipAddress,
                    loginTime: new Date(),
                    location: 'Unknown'
                });
            }
        }

        // save the expoPushToken if not saved already
        if (!user.expoPushToken && expoPushToken) {
            user.expoPushToken = expoPushToken;
            await user.save();
            console.log('Updated user expoPushToken:', expoPushToken.substring(0, 20) + '...');
        }

        // Create the token
        const token = await jwt.sign({_id: user._id}, process.env.SECRET_KEY, {
            algorithm: "HS256",
        });

        // Respond with success
        return res.status(200).json({
            success: true,
            message: 'Login successful',
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                expoPushToken: user.expoPushToken,
                lastLogin: user.lastLogin,
                createdAt: user.createdAt,
                // Don't send password or sensitive info
            },
            token
        });

    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
};

const addReferralCode = async (req, res) => {
    const user = req.user;
    const { referBy } = req.body;

    if (!referBy) return res.status(400).json({ message: 'Referral code is required' });

    try {
        if (user.registrationMethod === "google" && !user.referBy) {

            // Check if referral code exist
            const referByUser = await Users.findOne({ refCode: referBy });
            if (!referByUser) return res.status(404).json({ message: 'User with referral code does not exist' });

            // Update the referred by
            await Users.findByIdAndUpdate(user._id,
                { "$set": 
                    { referBy: referBy }
                }
            );
            return res.status(200).json({ message: 'Referal code updated' });
        }

        return res.status(406).json({ message: 'Not allowed' });
    } catch (error) {
        console.log("Error: ", error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALL_BACK,
    passReqToCallback: true
  },
  async function(request, accessToken, refreshToken, profile, done) {
    try {
        // Check if the user already exists in the database
        const googleEmail = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
        
        if (!googleEmail) {
            return done(new Error('No email found in Google profile'), null);
        }

        let existingUser;
        existingUser = await Users.findOne({ email: googleEmail });

        if (existingUser) {
            // User exists by email
            if (existingUser.googleId === profile.id) {
                // User already has the correct Google ID
                return done(null, existingUser);
            } else {
                // Update the Google ID for the existing user
                existingUser = await Users.findByIdAndUpdate(
                    existingUser._id,
                    { "$set": { googleId: profile.id } },
                    { new: true } // Return the updated document
                );
                console.log(`Updated Google ID for user: ${email}`);
                return done(null, existingUser);
            }
        }

        // User does not exist, proceed to create a new user
        const newUser = new Users({
            name: profile.displayName,
            email: profile.emails[0].value,
            googleId: profile.id,
            registrationMethod: "google"
        });

        // Save the new user to the database
        await newUser.save();
        
        return done(null, newUser);
    } catch (error) {
        console.error('Error in Google OAuth strategy:', error.message);
        return done(error, null);
    }
  }
));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await Users.findById(id);
        done(null, user);
    } catch (error) {
        console.error('Error in deserializeUser:', error.message);
        done(error, null);
    }
});

module.exports = { Signup, loginUser, resendOTP, verifyOTP, forgotPassword, resetPassword, addReferralCode };
