const { validationResult } = require('express-validator');
const { Users } = require('../models/users');
const fs = require('fs').promises;
const path = require('path');

const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper to upload a single file to Cloudinary
const uploadToCloudinary = async (file, userId) => {
  try {
    const resourceType = file.mimetype.startsWith('image/') ? 'image' :
                         file.mimetype.startsWith('video/') ? 'video' : 'raw';
    
    const result = await cloudinary.uploader.upload(file.path, {
      resource_type: resourceType,
      folder: `elentis/users/${userId}`,
      public_id: `${Date.now()}_${path.basename(file.originalname, path.extname(file.originalname))}`,
    });

    // Delete temporary file
    await fs.unlink(file.path);

    return {
      url: result.secure_url,
      publicId: result.public_id,
      assetId: result.asset_id,
      format: result.format,
      resourceType: result.resource_type,
      createdAt: result.created_at,
    };
  } catch (error) {
    // Delete temporary file on error
    if (file.path) await fs.unlink(file.path).catch(() => {});
    throw new Error(`Cloudinary upload failed: ${error.message}`);
  }
};

/**
 * Upload a single file to Cloudinary
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.uploadSingleFile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { user } = req;
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const result = await uploadToCloudinary(req.file, user._id);

    // Optionally associate with user (e.g., store in user profile)
    await Users.findByIdAndUpdate(user._id, {
      $push: { uploadedFiles: result.publicId },
    });

    res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      data: result,
    });
  } catch (error) {
    console.error('Single file upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

/**
 * Upload multiple files to Cloudinary
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.uploadMultipleFiles = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { user } = req;
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, error: 'No files uploaded' });
    }

    const uploadPromises = req.files.map(file => uploadToCloudinary(file, user._id));
    const results = await Promise.all(uploadPromises);

    // Optionally associate with user
    await Users.findByIdAndUpdate(user._id, {
      $push: { uploadedFiles: { $each: results.map(r => r.publicId) } },
    });

    res.status(200).json({
      success: true,
      message: 'Files uploaded successfully',
      data: results,
    });
  } catch (error) {
    console.error('Multiple files upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};