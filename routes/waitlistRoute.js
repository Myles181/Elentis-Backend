let express = require('express');
const { waitlistAdd, waitlistRetrieve } = require('../controller/waitlist');
let router = express.Router();


/**
 * @swagger
 * /api/waitlist:
 *   post:
 *     summary: Add a new email to the waitlist
 *     tags: [Waitlist]
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
 *               earlyAccess:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Email added succesfully
 *       400:
 *         description: Invalud data
 *       500:
 *         description: Internal server error
 */
router.post('', waitlistAdd);

/**
 * @swagger
 * /api/waitlist:
 *   get:
 *     responses:
 *       200:
 *         description: Email Retrieved successfully
 *       500:
 *         description: Internal Server Error
 */
router.get('', waitlistRetrieve);

module.exports = router;