const express = require('express');
const { 
    createCommunity, 
    getCommunities, 
    getMyCommunities, 
    joinCommunities, 
    leaveCommunity 
} = require('../controller/community');
const { tokenRequired } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/community:
 *   post:
 *     summary: Create a new community
 *     tags: [Community]
 *     security:
 *       - elentisAccessToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               isPrivate:
 *                 type: boolean
 *              requestRequired:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Community created successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/', tokenRequired, createCommunity);

/**
 * @swagger
 * /api/community:
 *   get:
 *     summary: Get all communities
 *     tags: [Community]
 *     security:
 *       - elentisAccessToken: []
 *     responses:
 *       200:
 *         description: Communities fetched successfully
 *       400:
 *         description: No communities found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/', tokenRequired, getCommunities);

/**
 * @swagger
 * /api/community/my:
 *   get:
 *     summary: Get communities the user is a member of
 *     tags: [Community]
 *     security:
 *       - elentisAccessToken: []
 *     responses:
 *       200:
 *         description: User communities fetched successfully
 *       400:
 *         description: No communities found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/my', tokenRequired, getMyCommunities);

/**
 * @swagger
 * /api/community/join:
 *   post:
 *     summary: Join a community using invitation code
 *     tags: [Community]
 *     security:
 *       - elentisAccessToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               inviteCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully joined community
 *       400:
 *         description: Invalid invite code
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/join', tokenRequired, joinCommunities);

/**
 * @swagger
 * /api/community/leave:
 *   post:
 *     summary: Leave a community
 *     tags: [Community]
 *     security:
 *       - elentisAccessToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               communityId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully left community
 *       400:
 *         description: Invalid community ID
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/leave', tokenRequired, leaveCommunity);

module.exports = router;
