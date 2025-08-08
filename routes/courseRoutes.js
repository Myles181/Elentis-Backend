const express = require('express');
const { 
    getCourses, 
    getCourseById, 
    getUserCourses, 
    getUserCourseById, 
    createCourse, 
    updateCourse,
    enrollCourse 
} = require('../controller/courses');
const { tokenRequired } = require('../middleware/auth');
const router = express.Router();

/**
 * @swagger
 * /api/courses:
 *   get:
 *     summary: Get all courses
 *     tags: [Courses]
 *     security:
 *       - elentisAccessToken: []
 *     responses:
 *       200:
 *         description: Courses fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 courses:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: No courses found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/', tokenRequired, getCourses);

/**
 * @swagger
 * /api/courses/user/enrolled:
 *   get:
 *     summary: Get user's enrolled courses
 *     tags: [Courses]
 *     security:
 *       - elentisAccessToken: []
 *     responses:
 *       200:
 *         description: User courses fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 userCourses:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: No courses found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/user/enrolled', tokenRequired, getUserCourses);

/**
 * @swagger
 * /api/courses/user/{id}:
 *   get:
 *     summary: Get specific user course by ID
 *     tags: [Courses]
 *     security:
 *       - elentisAccessToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User Course ID
 *     responses:
 *       200:
 *         description: User course fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 userCourse:
 *                   type: object
 *       400:
 *         description: Course not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/user/:id', tokenRequired, getUserCourseById);

/**
 * @swagger
 * /api/courses/{courseId}/enroll:
 *   post:
 *     summary: Enroll in a course
 *     tags: [Courses]
 *     security:
 *       - elentisAccessToken: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID to enroll in
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               saved:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Successfully enrolled in course
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Course not found or already enrolled
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
 *       500:
 *         description: Internal server error
 */
router.post('/:courseId/enroll', tokenRequired, enrollCourse);

/**
 * @swagger
 * /api/courses/{id}:
 *   get:
 *     summary: Get course by ID
 *     tags: [Courses]
 *     security:
 *       - elentisAccessToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     responses:
 *       200:
 *         description: Course fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 course:
 *                   type: object
 *       400:
 *         description: Course not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/:id', tokenRequired, getCourseById);

/**
 * @swagger
 * /api/courses:
 *   post:
 *     summary: Create a new course
 *     tags: [Courses]
 *     security:
 *       - elentisAccessToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - subtitle
 *               - language
 *               - courseType
 *               - payAmount
 *               - image
 *               - expectedDuration
 *               - skills
 *               - sections
 *             properties:
 *               title:
 *                 type: string
 *               subtitle:
 *                 type: string
 *               language:
 *                 type: string
 *               courseType:
 *                 type: string
 *               payAmount:
 *                 type: number
 *               image:
 *                 type: string
 *               expectedDuration:
 *                 type: string
 *               public:
 *                 type: boolean
 *               skills:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *               sections:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     title:
 *                       type: string
 *                     article:
 *                       type: string
 *                     videoUrl:
 *                       type: string
 *                     watchTime:
 *                       type: number
 *     responses:
 *       201:
 *         description: Course created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 course:
 *                   type: object
 *       400:
 *         description: Validation error or course already exists
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/', tokenRequired, createCourse);

/**
 * @swagger
 * /api/courses/{id}:
 *   put:
 *     summary: Update a course
 *     tags: [Courses]
 *     security:
 *       - elentisAccessToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               subtitle:
 *                 type: string
 *               language:
 *                 type: string
 *               courseType:
 *                 type: string
 *               payAmount:
 *                 type: number
 *               image:
 *                 type: string
 *               expectedDuration:
 *                 type: string
 *               public:
 *                 type: boolean
 *               skills:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *               sections:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     title:
 *                       type: string
 *                     article:
 *                       type: string
 *                     videoUrl:
 *                       type: string
 *                     watchTime:
 *                       type: number
 *     responses:
 *       200:
 *         description: Course updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 course:
 *                   type: object
 *       400:
 *         description: Validation error or course already exists
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized to update this course
 *       404:
 *         description: Course not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', tokenRequired, updateCourse);

module.exports = router; 