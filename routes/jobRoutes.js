const express = require('express');
const { 
    createJob, 
    getJobs, 
    getJobById, 
    updateJob, 
    deleteJob, 
    getJobsByUser,
    getApplicationsForJob 
} = require('../controller/jobs');
const { tokenRequired } = require('../middleware/auth');
const router = express.Router();

/**
 * @swagger
 * /api/jobs:
 *   get:
 *     summary: Get all active jobs with pagination
 *     tags: [Jobs]
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
 *         description: Number of jobs per page
 *     responses:
 *       200:
 *         description: Jobs fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 jobs:
 *                   type: array
 *                   items:
 *                     type: object
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 *                 totalJobs:
 *                   type: integer
 *       500:
 *         description: Internal server error
 */
router.get('/', getJobs);

/**
 * @swagger
 * /api/jobs/my-jobs:
 *   get:
 *     summary: Get jobs created by the authenticated user
 *     tags: [Jobs]
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
 *         description: Number of jobs per page
 *     responses:
 *       200:
 *         description: User jobs fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 jobs:
 *                   type: array
 *                   items:
 *                     type: object
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 *                 totalJobs:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/my-jobs', tokenRequired, getJobsByUser);

/**
 * @swagger
 * /api/jobs/{id}/applications:
 *   get:
 *     summary: Get applications for a specific job (job owner only)
 *     tags: [Jobs]
 *     security:
 *       - elentisAccessToken: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *                     properties:
 *                       _id:
 *                         type: string
 *                       job:
 *                         type: string
 *                       user:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *                       appliedAt:
 *                         type: string
 *                         format: date-time
 *                 totalPages:
 *                   type: integer
 *                 currentPage:
 *                   type: integer
 *                 totalApplications:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized to view applications for this job
 *       404:
 *         description: Job not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id/applications', tokenRequired, getApplicationsForJob);

/**
 * @swagger
 * /api/jobs/{id}:
 *   get:
 *     summary: Get job by ID
 *     tags: [Jobs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID
 *     responses:
 *       200:
 *         description: Job fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 job:
 *                   type: object
 *       404:
 *         description: Job not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', getJobById);

/**
 * @swagger
 * /api/jobs:
 *   post:
 *     summary: Create a new job
 *     tags: [Jobs]
 *     security:
 *       - elentisAccessToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - highlights
 *               - salary
 *               - salaryType
 *               - jobType
 *               - experience
 *               - companyName
 *               - location
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               highlights:
 *                 type: string
 *               salary:
 *                 type: number
 *               salaryType:
 *                 type: string
 *                 enum: [hourly, monthly, yearly]
 *               jobType:
 *                 type: string
 *                 enum: [full-time, part-time, contract, freelance]
 *               experience:
 *                 type: string
 *               skillsRequired:
 *                 type: array
 *                 items:
 *                   type: string
 *               companyName:
 *                 type: string
 *               location:
 *                 type: string
 *               companyWebsite:
 *                 type: string
 *               companyLogo:
 *                 type: string
 *                 format: binary
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 default: active
 *     responses:
 *       201:
 *         description: Job created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 job:
 *                   type: object
 *       400:
 *         description: Validation error or missing required fields
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/', tokenRequired, createJob);

/**
 * @swagger
 * /api/jobs/{id}:
 *   put:
 *     summary: Update a job
 *     tags: [Jobs]
 *     security:
 *       - elentisAccessToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               highlights:
 *                 type: string
 *               salary:
 *                 type: number
 *               salaryType:
 *                 type: string
 *               jobType:
 *                 type: string
 *               experience:
 *                 type: string
 *               skillsRequired:
 *                 type: array
 *                 items:
 *                   type: string
 *               companyName:
 *                 type: string
 *               location:
 *                 type: string
 *               companyWebsite:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *     responses:
 *       200:
 *         description: Job updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 job:
 *                   type: object
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized to update this job
 *       404:
 *         description: Job not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', tokenRequired, updateJob);

/**
 * @swagger
 * /api/jobs/{id}:
 *   delete:
 *     summary: Delete a job (soft delete - sets status to inactive)
 *     tags: [Jobs]
 *     security:
 *       - elentisAccessToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID
 *     responses:
 *       200:
 *         description: Job deleted successfully
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
 *         description: Not authorized to delete this job
 *       404:
 *         description: Job not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', tokenRequired, deleteJob);

module.exports = router;