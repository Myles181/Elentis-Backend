const express = require('express');
const { getUser, updateUser, getAllMessagesProfile, getMessageById, markMessagesAsRead } = require('../controller/user');
const { tokenRequired } = require('../middleware/auth');
const router = express.Router();

/**
 * @swagger
 * /api/user/profile:
 *   get:
 *     summary: Get user profile data
 *     tags: [User]
 *     security:
 *       - elentisAccessToken: []
 *     responses:
 *       200:
 *         description: User data fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 userData:
 *                   type: object
 *       400:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/profile', tokenRequired, getUser);

/**
 * @swagger
 * /api/user/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [User]
 *     security:
 *       - elentisAccessToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               interest:
 *                 type: string
 *               skills:
 *                 type: string
 *               location:
 *                 type: string
 *               language:
 *                 type: string
 *               dailyReminder:
 *                 type: boolean
 *               dailyReminderTime:
 *                 type: string
 *               profilePicture:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: User data updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 userData:
 *                   type: object
 *       400:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.put('/profile', tokenRequired, updateUser);

module.exports = router;