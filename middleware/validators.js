const { body } = require('express-validator');
require('dotenv').config();

exports.signupValidator = [
    body('name')
        .trim()
        .notEmpty().withMessage('Username is required')
        .isLength({ min: 5 }).withMessage('Username must be at least 5 characters long'),

    body('skills')
        .optional().isArray().withMessage('Skills must be an array'),

    body('interest').optional().isString().withMessage('Must be a string')
        .trim(),

    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format')
        .isLength({ min: 5 }).withMessage('Email must be at least 5 characters long'),

    body('password')
        .trim()
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
];

exports.loginValidator = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format')
        .isLength({ min: 5 }).withMessage('Email must be at least 5 characters long'),

    body('password')
        .trim()
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
];

exports.EmailValidator = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format')
];

exports.resetPasswordValidator = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format'),

    body('newPassword')
        .trim()
        .notEmpty().withMessage('Password is required'),
    
    body('otp')
        .trim()
        .notEmpty().withMessage('Otp is required')
];

exports.verifyEmailValidator = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format'),

    body('otp')
        .trim()
        .notEmpty().withMessage('Otp is required')
];

