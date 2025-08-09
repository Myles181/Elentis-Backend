const crypto = require('crypto');
const { Users } = require('../models/users');
const { OTP } = require('../models/otp');
const { Reset_OTP } = require('../models/resetOtp');

/**
 * Generates a numeric OTP of a given length
 * @param {number} length 
 * @returns {string}
 */
function generateNumericOTP(length = 6) {
    return Array.from(crypto.randomBytes(length))
        .map(byte => (byte % 10).toString()) // Fix typo from toxString to toString
        .join('');
}

/**
 * Creates or replaces OTP for a given email
 * @param {string} email 
 * @returns {Promise<string>} the newly generated OTP
 */
async function createOrUpdateOTP(email) {
    // Delete any existing OTP for the email
    await OTP.findOneAndDelete({ email });

    // Generate a new OTP
    const otpCode = generateNumericOTP();

    // Create and save the new OTP
    const newOtp = new OTP({ email, otp: otpCode });
    await newOtp.save();

    return otpCode;
}

/**
 * Creates or replaces OTP for a password reset otp
 * @param {string} email 
 * @returns {Promise<string>} the newly generated OTP
 */
async function createOrUpdateResetOTP(email) {
    // Delete any existing OTP for the email
    await Reset_OTP.findOneAndDelete({ email });

    // Generate a new OTP
    const otpCode = generateNumericOTP();

    // Create and save the new OTP
    const newOtp = new Reset_OTP({ email, otp: otpCode });
    await newOtp.save();

    return otpCode;
}

// Generate referal code
async function generateReferralCdoe(length = 6) {
    const refCode = crypto.randomBytes(6).toString('hex').toUpperCase();

    const checkIfExist = await Users.findOne({ refCode: refCode });
    if (checkIfExist) return generateReferralCdoe(length);

    return refCode;
}

function getDailyReminderTime(time) {
    // Handle AM/PM format (e.g., "02:00 am", "02:00 pm")
    const timeLower = time.toLowerCase().trim();
    const hasAmPm = timeLower.includes('am') || timeLower.includes('pm');
    
    if (hasAmPm) {
        // Extract time and AM/PM indicator
        const timeMatch = timeLower.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/);
        if (!timeMatch) {
            throw new Error('Invalid time format. Expected format: HH:MM AM/PM');
        }
        
        let [_, hours, minutes, period] = timeMatch;
        hours = parseInt(hours);
        minutes = parseInt(minutes);
        
        // Convert to 24-hour format
        if (period === 'pm' && hours !== 12) {
            hours += 12;
        } else if (period === 'am' && hours === 12) {
            hours = 0;
        }
        
        return { 
            hours: hours.toString().padStart(2, '0'), 
            minutes: minutes.toString().padStart(2, '0') 
        };
    } else {
        // Handle 24-hour format (e.g., "14:00")
        const [hours, minutes] = time.split(':');
        return { 
            hours: hours.padStart(2, '0'), 
            minutes: minutes.padStart(2, '0') 
        };
    }
}

/**
 * Validates if a URL is a valid Cloudinary URL (image or video)
 * @param {string} url 
 * @returns {boolean}
 */
function isValidCloudinaryUrl(url) {
    if (!url || typeof url !== 'string') return false;
    
    // Cloudinary URL pattern: https://res.cloudinary.com/cloud_name/image/upload/... or video/upload/...
    const cloudinaryImagePattern = /^https:\/\/res\.cloudinary\.com\/[a-zA-Z0-9_-]+\/image\/upload\/.+$/;
    const cloudinaryVideoPattern = /^https:\/\/res\.cloudinary\.com\/[a-zA-Z0-9_-]+\/video\/upload\/.+$/;
    
    return cloudinaryImagePattern.test(url) || cloudinaryVideoPattern.test(url);
}

/**
 * Uploads an image to Cloudinary
 * @param {Object} file - File object from multer
 * @returns {Promise<Object>} - Cloudinary upload result
 */
async function uploadImage(file) {
    const cloudinary = require('cloudinary').v2;
    
    try {
        const result = await cloudinary.uploader.upload(file.path, {
            folder: 'elentis/jobs',
            resource_type: 'image'
        });
        
        return {
            url: result.secure_url,
            public_id: result.public_id
        };
    } catch (error) {
        throw new Error(`Image upload failed: ${error.message}`);
    }
}

module.exports = { createOrUpdateOTP, createOrUpdateResetOTP, generateReferralCdoe, getDailyReminderTime, isValidCloudinaryUrl, uploadImage };
