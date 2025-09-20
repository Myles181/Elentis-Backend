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
 *     description: Creates a new course with required fields and validates structure (e.g., non-empty skills/sections, Cloudinary image/video URLs, at least one section with content). Title must be unique.
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
 *                 description: Course title (non-empty, unique)
 *               subtitle:
 *                 type: string
 *                 description: Course subtitle (non-empty)
 *               language:
 *                 type: string
 *                 description: Language of the course (non-empty, e.g., 'English')
 *               courseType:
 *                 type: string
 *                 description: Type of course (non-empty, e.g., 'beginner')
 *               payAmount:
 *                 type: number
 *                 description: Payment amount (non-negative number)
 *               image:
 *                 type: string
 *                 description: Cloudinary URL for course image (required, valid format)
 *               expectedDuration:
 *                 type: string
 *                 description: Expected course duration (non-empty, e.g., '2 weeks')
 *               public:
 *                 type: boolean
 *                 description: "Whether the course is public (default: true)"
 *               skills:
 *                 type: array
 *                 description: Array of skills taught (non-empty)
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       description: Skill name (non-empty)
 *           examples:
 *             example1:
 *               summary: Valid course creation request
 *               value:
 *                 title: "Introduction to JavaScript"
 *                 subtitle: "Learn the basics of JS programming"
 *                 language: "English"
 *                 courseType: "beginner"
 *                 payAmount: 49.99
 *                 image: "https://res.cloudinary.com/demo/image/upload/v1234567890/course-js.jpg"
 *                 expectedDuration: "4 weeks"
 *                 public: true
 *                 skills:
 *                   - name: "Variables"
 *                   - name: "Functions"
 *                 sections:
 *                   - name: "Section 1"
 *                     title: "Getting Started"
 *                     article: "Welcome to JavaScript! This is an introductory article."
 *                     watchTime: 5
 *                   - name: "Section 2"
 *                     title: "Variables"
 *                     videoUrl: "https://res.cloudinary.com/demo/video/upload/v1234567890/var-lesson.mp4"
 *                     watchTime: 10
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
 *                   description: Full course object including computed totalWatchTime
 *             examples:
 *               example1:
 *                 summary: Successful creation
 *                 value:
 *                   success: true
 *                   message: "Course created successfully"
 *                   course:
 *                     _id: "64f7b1234567890abcdef123"
 *                     title: "Introduction to JavaScript"
 *                     subtitle: "Learn the basics of JS programming"
 *                     language: "English"
 *                     courseType: "beginner"
 *                     payAmount: 49.99
 *                     image: "https://res.cloudinary.com/demo/image/upload/v1234567890/course-js.jpg"
 *                     expectedDuration: "4 weeks"
 *                     totalWatchTime: 15
 *                     public: true
 *                     authorBy: "user123"
 *                     createdAt: "2025-09-13T10:00:00.000Z"
 *                     skills:
 *                       - name: "Variables"
 *                       - name: "Functions"
 *                     sections:
 *                       - name: "Section 1"
 *                         title: "Getting Started"
 *                         article: "Welcome to JavaScript! This is an introductory article."
 *                         watchTime: 5
 *                       - name: "Section 2"
 *                         title: "Variables"
 *                         videoUrl: "https://res.cloudinary.com/demo/video/upload/v1234567890/var-lesson.mp4"
 *                         watchTime: 10
 *       400:
 *         description: Validation error (e.g., missing fields, invalid URLs, duplicate title, no content in sections) or course already exists
 *       401:
 *         description: Unauthorized (missing/invalid token)
 *       500:
 *         description: Internal server error
 */
router.post('/', tokenRequired, createCourse);

/**
 * @swagger
 * /api/courses/{id}:
 *   put:
 *     summary: Update an existing course
 *     description: Partially updates a course if owned by the authenticated user. Validates only provided fields (e.g., Cloudinary URLs if image/sections updated). Title uniqueness checked excluding self. Recomputes totalWatchTime if sections provided.
 *     tags: [Courses]
 *     security:
 *       - elentisAccessToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Course ID (MongoDB ObjectId)
 *     requestBody:
 *       required: false
 *       description: Partial updates; omit fields to keep existing values
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Updated course title (non-empty, unique excluding self)
 *               subtitle:
 *                 type: string
 *                 description: Updated course subtitle (non-empty)
 *               language:
 *                 type: string
 *                 description: Updated language (non-empty, e.g., 'English')
 *               courseType:
 *                 type: string
 *                 description: Updated course type (non-empty, e.g., 'beginner')
 *               payAmount:
 *                 type: number
 *                 description: Updated payment amount (non-negative number)
 *               image:
 *                 type: string
 *                 description: Updated Cloudinary URL for course image (valid format)
 *               expectedDuration:
 *                 type: string
 *                 description: Updated expected duration (non-empty, e.g., '4 weeks')
 *               public:
 *                 type: boolean
 *                 description: Updated public visibility
 *               skills:
 *                 type: array
 *                 description: Updated skills array (non-empty if provided)
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       description: Skill name (non-empty)
 *               sections:
 *                 type: array
 *                 description: Updated sections array (non-empty with content if provided)
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       description: Section name (non-empty)
 *                     title:
 *                       type: string
 *                       description: Section title (non-empty)
 *                     article:
 *                       type: string
 *                       description: Optional section article content
 *                     videoUrl:
 *                       type: string
 *                       description: Optional Cloudinary URL for section video
 *                     watchTime:
 *                       type: number
 *                       description: Optional watch time in minutes (non-negative)
 *           examples:
 *             example1:
 *               summary: Partial update (e.g., change title and add a section)
 *               value:
 *                 title: "Advanced JavaScript"
 *                 payAmount: 59.99
 *                 sections:
 *                   - name: "Section 3"
 *                     title: "Advanced Topics"
 *                     videoUrl: "https://res.cloudinary.com/demo/video/upload/v1234567891/advanced-js.mp4"
 *                     watchTime: 20
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
 *                   description: Full updated course object
 *             examples:
 *               example1:
 *                 summary: Successful update
 *                 value:
 *                   success: true
 *                   message: "Course updated successfully"
 *                   course:
 *                     _id: "64f7b1234567890abcdef123"
 *                     title: "Advanced JavaScript"
 *                     subtitle: "Learn the basics of JS programming"
 *                     language: "English"
 *                     courseType: "beginner"
 *                     payAmount: 59.99
 *                     image: "https://res.cloudinary.com/demo/image/upload/v1234567890/course-js.jpg"
 *                     expectedDuration: "4 weeks"
 *                     totalWatchTime: 35  # Recomputed if sections updated
 *                     public: true
 *                     authorBy: "user123"
 *                     createdAt: "2025-09-13T10:00:00.000Z"
 *                     skills:
 *                       - name: "Variables"
 *                       - name: "Functions"
 *                     sections:
 *                       - name: "Section 1"
 *                         title: "Getting Started"
 *                         article: "Welcome to JavaScript! This is an introductory article."
 *                         watchTime: 5
 *                       - name: "Section 2"
 *                         title: "Variables"
 *                         videoUrl: "https://res.cloudinary.com/demo/video/upload/v1234567890/var-lesson.mp4"
 *                         watchTime: 10
 *                       - name: "Section 3"
 *                         title: "Advanced Topics"
 *                         videoUrl: "https://res.cloudinary.com/demo/video/upload/v1234567891/advanced-js.mp4"
 *                         watchTime: 20
 *       400:
 *         description: Validation error (e.g., invalid fields, duplicate title) or course already exists
 *       401:
 *         description: Unauthorized (missing/invalid token)
 *       403:
 *         description: Not authorized to update this course (not owner)
 *       404:
 *         description: Course not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', tokenRequired, updateCourse);


module.exports = router;