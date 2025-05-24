let express = require('express');
let jwt = require('jsonwebtoken');
const passport = require('passport');

const { Signup, loginUser, resendOTP, verifyOTP, forgotPassword, resetPassword, addReferralCode } = require('../controller/auth');
const { signupValidator, loginValidator, EmailValidator, verifyEmailValidator, resetPasswordValidator } = require('../middleware/validators');
let router = express.Router();


/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               name:
 *                 type: string
 *               interest:
 *                 type: string
 *               skills:
 *                 type: string
 *               password:
 *                 type: string
 *               referBy:
 *                 type: string
 *     responses:
 *       200:
 *         description: Registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: Boolean
 *                 message:
 *                   type: String
 *                 email:
 *                   type: String
 *               example:
 *                 success: true
 *                 message: "OTP sent to your email. Please verify to complete registration."
 *                 email: "example@gmail.com"
 *       400:
 *         description: Invalud data
 *       500:
 *         description: Internal server error
 */
router.post('/register', ...signupValidator, Signup);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login into your account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: Boolean
 *                 message:
 *                   type: String
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: String
 *                     email:
 *                       type: String
 *                     name:
 *                       type: String   
 *               example:
 *                 success: true
 *                 message: "Login Successful"
 *                 user: {
 *                          id: "8943-ujb3-oe93",
 *                          email: "example@gmail.com",
 *                          name: "Micheal"
 *                      }
 *       400:
 *         description: Invalud data
 *       500:
 *         description: Internal server error
 */
router.post('/login', ...loginValidator, loginUser);


/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Forgot Password
 *     tags: [Auth]
 *     description: Sends a password reset link to the user's email.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Reset link sent to email.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Server error.
 */
router.post('/forgot-password', ...EmailValidator, forgotPassword);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset Password
 *     tags: [Auth]
 *     description: Resets the user's password using a token.
 * 
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: password
 *               otp:
 *                 type: string
 *                 format: password
 *               newPassword:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Password reset successfully.
 *       400:
 *         description: Invalid or expired token.
 *       500:
 *         description: Server error.
 */
router.post('/reset-password', ...resetPasswordValidator, resetPassword);

/**
 * @swagger
 * /api/auth/verify-email:
 *   post:
 *     summary: Verify Email
 *     tags: [Auth]
 *     description: Verifies user's email using an OTP.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email verified successfully.
 *       400:
 *         description: Invalid OTP.
 *       500:
 *         description: Server error.
 */
router.post('/verify-email', ...verifyEmailValidator, verifyOTP);

/**
 * @swagger
 * /api/auth/resend-otp:
 *   post:
 *     summary: Resend OTP
 *     tags: [Auth]
 *     description: Resends an OTP to the user's email.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: New OTP sent to email.
 *       500:
 *         description: Server error.
 */
router.post('/resend-otp', ...EmailValidator, resendOTP);

/**
 * @swagger
 * /api/auth/google/referalcode:
 *   post:
 *     summary: Add referal code after google registration
 *     tags: [Auth]
 *     security:
 *       - elentisAccessToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               referBy:
 *                 type: string
 *     responses:
 *       200:
 *         description: Referal code added successfully
 *       400:
 *         description: Referral code is required
 *       404:
 *         description: User with referral code does not exist
 *       406:
 *         description: Not allowed
 *       500:
 *         description: Server error
 */
router.post('/google/referalcode', addReferralCode);

/**
 * @swagger
 * /api/auth/google:
 *   get:
 *     summary: Authenticate with Google
 *     tags: [Auth]
 *     description: Redirects the user to Google's authentication page.
 *     responses:
 *       302:
 *         description: Redirects to Google authentication
 */
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

/**
 * @swagger
 * /api/auth/google/callback:
 *   get:
 *     summary: Google authentication callback
 *     tags: [Auth]
 *     description: Handles the callback from Google after authentication.
 *     responses:
 *       302:
 *         description: Redirects to dashboard after successful login
 *       401:
 *         description: Authentication failed
 */
router.get('/google/callback', 
    passport.authenticate('google', { 
        failureRedirect: '/auth/google/failure'
    }),
    (req, res) => {
        // Authentication successful, redirect to success route
        res.redirect('/auth/google/success');
    }
);

/**
 * @swagger
 * /api/auth/google/success:
 *   get:
 *     summary: Handle successful Google authentication
 *     tags: [Auth]
 *     description: Returns a JWT token after successful Google authentication
 *     responses:
 *       200:
 *         description: JWT token provided
 */
router.get('/google/success', (req, res) => {
    // Make sure user is authenticated
    if (!req.user) {
        return res.redirect('/auth/google/failure');
    }

    // Generate JWT token using authenticated user's ID
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.json({
        message: "Login successful",
        token,
        user: {
            id: req.user._id,
            email: req.user.email,
            username: req.user.username
        }
    });
});

/**
 * @swagger
 * /api/auth/google/failure:
 *   get:
 *     summary: Handle failed Google authentication
 *     tags: [Auth]
 *     description: Returns an error message when Google authentication fails
 *     responses:
 *       401:
 *         description: Authentication failed
 */
router.get('/google/failure', (req, res) => {
    res.status(401).json({ error: "Authentication failed" });
});


module.exports = router;