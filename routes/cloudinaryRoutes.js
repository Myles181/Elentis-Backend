// routes/uploads.js
const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const multer = require('multer');
const { tokenRequired } = require('../middleware/auth');
const cloudinaryController = require('../controller/cloudinary');

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const fileFilter = (req, file, cb) => {
  // Accept images, videos, and other files
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif',
    'video/mp4', 'video/mpeg', 'video/webm',
    'application/pdf', 'text/plain',
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
});

// Ensure uploads directory exists
const fs = require('fs');
fs.mkdirSync('uploads/', { recursive: true });

/**
 * @swagger
 * /api/uploads/single:
 *   post:
 *     summary: Upload a single file to Cloudinary
 *     tags: [Uploads]
 *     security:
 *       - elentisAccessToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/UploadSingleFileRequest'
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/FileResponse'
 *       400:
 *         description: Invalid input or file type
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
router.post(
  '/single',
  tokenRequired,
  upload.single('file'),
  [check('file').custom((value, { req }) => req.file).withMessage('File is required')],
  cloudinaryController.uploadSingleFile
);

/**
 * @swagger
 * /api/uploads/multiple:
 *   post:
 *     summary: Upload multiple files to Cloudinary
 *     tags: [Uploads]
 *     security:
 *       - elentisAccessToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/UploadMultipleFilesRequest'
 *     responses:
 *       200:
 *         description: Files uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/FileResponse'
 *       400:
 *         description: Invalid input or file type
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
router.post(
  '/multiple',
  tokenRequired,
  upload.array('files', 10), // Max 10 files
  [check('files').custom((value, { req }) => req.files && req.files.length > 0).withMessage('At least one file is required')],
  cloudinaryController.uploadMultipleFiles
);

module.exports = router;