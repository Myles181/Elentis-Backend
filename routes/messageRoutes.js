const express = require('express');
const { getAllMessagesProfile, getMessageById, markMessagesAsRead } = require('../controller/message');
const { tokenRequired } = require('../middleware/auth');
const router = express.Router();


/**
 * @swagger
 * /api/messages:
 *   get:
 *     summary: Get all conversations for the logged-in user
 *     tags: [Messages]
 *     security:
 *       - elentisAccessToken: []
 *     responses:
 *       200:
 *         description: List of conversations fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 conversations:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Conversation'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', tokenRequired, getAllMessagesProfile);

/**
 * @swagger
 * /api/messages/{id}/{type}:
 *   get:
 *     summary: Get messages from a specific conversation or community
 *     tags: [Messages]
 *     security:
 *       - elentisAccessToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user (for direct) or community
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [direct, community]
 *         description: Type of conversation (direct or community)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of messages to return
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of messages to skip for pagination
 *     responses:
 *       200:
 *         description: Messages fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 messages:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Message'
 *                 unreadCount:
 *                   type: integer
 *                   description: Number of unread messages
 *       400:
 *         description: Invalid type parameter or community ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Not a member of the community
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id/:type', tokenRequired, getMessageById);

/**
 * @swagger
 * /api/messages/{id}/{type}:
 *   post:
 *     summary: Mark specific messages as read in a conversation or community
 *     tags: [Messages]
 *     security:
 *       - elentisAccessToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user (for direct) or community
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [direct, community]
 *         description: Type of conversation (direct or community)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               unreadMessages:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of message IDs to mark as read
 *             required:
 *               - unreadMessages
 *     responses:
 *       200:
 *         description: Messages marked as read successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   description: Confirmation message with number of messages marked
 *       400:
 *         description: Invalid type, message IDs, or no valid unread messages
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Not a member of the community
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found (for direct messages)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:id/:type', tokenRequired, markMessagesAsRead);

module.exports = router;
