const express = require('express');
const { createSkillSwap } = require('../controller/skillSwap');
const { tokenRequired } = require('../middleware/auth');
const router = express.Router();

/**
 * @swagger
 * /api/skill-swap:
 *   post:
 *     summary: Create a skill swap request and find potential partners
 *     tags: [Skill Swap]
 *     security:
 *       - elentisAccessToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userA_skill
 *               - userA_proficiencyLevel
 *               - userA_experienceLevel
 *             properties:
 *               userA_skill:
 *                 type: string
 *                 description: The skill userA wants to learn (e.g., "React Native")
 *                 example: "React Native"
 *               userB_skill:
 *                 type: string
 *                 description: The skill userA can teach (optional)
 *                 example: "Python"
 *               userA_proficiencyLevel:
 *                 type: string
 *                 enum: [begineer, novice, intermediate, advance, expert]
 *                 description: UserA's proficiency level in the skill they want to learn
 *                 example: "begineer"
 *               userA_experienceLevel:
 *                 type: number
 *                 description: UserA's experience level (years of experience)
 *                 example: 2
 *     responses:
 *       201:
 *         description: Skill swap request created successfully with potential partners
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 skillSwap:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     userA_skill:
 *                       type: string
 *                     userB_skill:
 *                       type: string
 *                     userA_proficiencyLevel:
 *                       type: string
 *                     userA_experienceLevel:
 *                       type: number
 *                     status:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                 potentialPartners:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                     message:
 *                       type: string
 *                     targetSkill:
 *                       type: string
 *                     matches:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           userId:
 *                             type: string
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *                           skills:
 *                             type: array
 *                             items:
 *                               type: string
 *                           skillScore:
 *                             type: number
 *                           profilePicture:
 *                             type: string
 *                           location:
 *                             type: string
 *                           language:
 *                             type: string
 *                           matchReason:
 *                             type: string
 *                     totalMatches:
 *                       type: number
 *                     searchCriteria:
 *                       type: object
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/', tokenRequired, createSkillSwap);

module.exports = router;
