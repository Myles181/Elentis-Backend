const express = require('express');
const { 
    applyForJob,
    getMyApplications,
    getJobApplications,
    updateApplicationStatus,
    deleteApplication
} = require('../controller/jobApplication');
const { tokenRequired } = require('../middleware/auth');
const router = express.Router();

/**
 * @swagger
 * /api/job-applications/my-applications:
 *   get:
 *     summary: Get user's job applications
 *     tags: [Job Applications]
 *     security:
 *       - elentisAccessToken: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of applications per page
 *     responses:
 *       200:
 *         description: Applications fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 applications:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/my-applications', tokenRequired, getMyApplications);

/**
 * @swagger
 * /api/job-applications/jobs/{jobId}/applications:
 *   get:
 *     summary: Get applications for a specific job (job owner only)
 *     tags: [Job Applications]
 *     security:
 *       - elentisAccessToken: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of applications per page
 *     responses:
 *       200:
 *         description: Job applications fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 applications:
 *                   type: array
 *                   items:
 *                     type: object
 *                 job:
 *                   type: object
 *                 pagination:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized to view applications for this job
 *       404:
 *         description: Job not found
 *       500:
 *         description: Internal server error
 */
router.get('/jobs/:jobId/applications', tokenRequired, getJobApplications);

/**
 * @swagger
 * /api/job-applications/apply/{jobId}:
 *   post:
 *     summary: Apply for a job
 *     tags: [Job Applications]
 *     security:
 *       - elentisAccessToken: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID to apply for
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               coverLetter:
 *                 type: string
 *                 maxLength: 2000
 *                 description: Cover letter for the application
 *               resume:
 *                 type: string
 *                 format: binary
 *                 description: Resume file (optional)
 *     responses:
 *       201:
 *         description: Application submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 application:
 *                   type: object
 *       400:
 *         description: Already applied or validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Job not found or no longer active
 *       500:
 *         description: Internal server error
 */
router.post('/apply/:jobId', tokenRequired, applyForJob);

/**
 * @swagger
 * /api/job-applications/{applicationId}/status:
 *   put:
 *     summary: Update application status (job owner only)
 *     tags: [Job Applications]
 *     security:
 *       - elentisAccessToken: []
 *     parameters:
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Application ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, reviewed, accepted, rejected]
 *                 description: New status for the application
 *     responses:
 *       200:
 *         description: Application status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 application:
 *                   type: object
 *       400:
 *         description: Invalid status
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized to update this application
 *       404:
 *         description: Application not found
 *       500:
 *         description: Internal server error
 */
router.put('/:applicationId/status', tokenRequired, updateApplicationStatus);

/**
 * @swagger
 * /api/job-applications/{applicationId}:
 *   delete:
 *     summary: Delete job application (applicant only)
 *     tags: [Job Applications]
 *     security:
 *       - elentisAccessToken: []
 *     parameters:
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Application ID
 *     responses:
 *       200:
 *         description: Application deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized to delete this application
 *       404:
 *         description: Application not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:applicationId', tokenRequired, deleteApplication);

module.exports = router;