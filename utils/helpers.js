const crypto = require('crypto');
const { Users } = require('../models/users');
const { OTP } = require('../models/otp');
const { Reset_OTP } = require('../models/resetOtp');
const { PlatformFee } = require('../models/platformFees.js');
const community = require('../models/community');
// const 

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
    const refCode = (crypto.randomBytes(6).toString('hex').toUpperCase()).slice(0,length);

    const checkIfExist = await Users.findOne({ refCode: refCode });
    if (checkIfExist) return generateReferralCdoe(length);

    return refCode;
}

async function generateInvitationCode(length = 6) {
    const inviteCode = (crypto.randomBytes(6).toString('hex').toUpperCase()).slice(0,length);

    const checkIfExist = await community.findOne({ inviteCode: inviteCode });
    if (checkIfExist) return generateReferralCdoe(length);

    return inviteCode;
}

function getInviteCode(invitationCode) {
    const inviteCode = invitationCode.slice(0,6);
    const refCode = invitationCode.slice(6,);

    return {inviteCode, refCode};
}

async function getIds(invitationCode) {
    const { inviteCode, refCode } = getInviteCode(invitationCode);

    // Get the community id
    const communityId = await community.findOne({ inviteCode }, { _id: 1 });
    let refUserId = "";
    if (refCode) {
        refUserId = await Users.findOne({ refCode }, { _id: 1 });
    }

    return {communityId, refUserId};
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

/**
 * Finds the best userB for the skillSwap
 * @param {string} userA_skill 
 * @param {string} userA_proficiencyLevel 
 * @param {number} userA_experienceLevel 
 * @returns {Promise<Object>} - The best userB for the skillSwap
 */
async function findBestUserB(userA_skill, userA_proficiencyLevel, userA_experienceLevel) {
    try {
        const { Users } = require('../models/users');
        
        // Normalize the skill to lowercase for better matching
        const normalizedSkill = userA_skill.toLowerCase().trim();
        
        // Define skill relationships for better matching
        const skillRelationships = {
            'react': ['react native', 'reactjs', 'javascript', 'typescript', 'frontend', 'web development'],
            'react native': ['react', 'javascript', 'typescript', 'mobile development', 'expo'],
            'javascript': ['react', 'react native', 'node.js', 'typescript', 'frontend', 'backend'],
            'python': ['django', 'flask', 'fastapi', 'data science', 'machine learning', 'automation'],
            'java': ['spring boot', 'android', 'backend', 'enterprise'],
            'node.js': ['javascript', 'express', 'backend', 'api development'],
            'angular': ['typescript', 'frontend', 'web development'],
            'vue.js': ['javascript', 'frontend', 'web development'],
            'flutter': ['dart', 'mobile development', 'cross-platform'],
            'swift': ['ios', 'mobile development', 'apple'],
            'kotlin': ['android', 'mobile development', 'java'],
            'php': ['laravel', 'wordpress', 'backend', 'web development'],
            'c#': ['.net', 'asp.net', 'unity', 'backend'],
            'go': ['backend', 'microservices', 'cloud native'],
            'rust': ['systems programming', 'performance', 'backend'],
            'sql': ['database', 'mysql', 'postgresql', 'mongodb'],
            'mongodb': ['database', 'nosql', 'backend'],
            'aws': ['cloud computing', 'devops', 'infrastructure'],
            'docker': ['containerization', 'devops', 'deployment'],
            'kubernetes': ['container orchestration', 'devops', 'cloud native']
        };
        
        // Get related skills for the target skill
        const relatedSkills = skillRelationships[normalizedSkill] || [];
        const allSearchTerms = [normalizedSkill, ...relatedSkills];
        
        // Create a regex pattern for flexible matching
        const searchPattern = allSearchTerms.map(term => 
            term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        ).join('|');
        
        // Build the aggregation pipeline for efficient searching
        const pipeline = [
            // Stage 1: Match users with any of the related skills
            {
                $match: {
                    skills: {
                        $regex: new RegExp(searchPattern, 'i')
                    }
                }
            },
            
            // Stage 2: Add a score based on skill relevance
            {
                $addFields: {
                    skillScore: {
                        $reduce: {
                            input: "$skills",
                            initialValue: 0,
                            in: {
                                $add: [
                                    "$$value",
                                    {
                                        $cond: {
                                            if: {
                                                $regexMatch: {
                                                    input: { $toLower: "$$this" },
                                                    regex: new RegExp(`^${normalizedSkill}$`, 'i')
                                                }
                                            },
                                            then: 100, // Exact match gets highest score
                                            else: {
                                                $cond: {
                                                    if: {
                                                        $regexMatch: {
                                                            input: { $toLower: "$$this" },
                                                            regex: new RegExp(normalizedSkill, 'i')
                                                        }
                                                    },
                                                    then: 80, // Contains the skill
                                                    else: {
                                                        $cond: {
                                                            if: {
                                                                $in: [
                                                                    { $toLower: "$$this" },
                                                                    relatedSkills
                                                                ]
                                                            },
                                                            then: 60, // Related skill
                                                            else: 0
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    }
                }
            },
            
            // Stage 3: Filter out users with zero score
            {
                $match: {
                    skillScore: { $gt: 0 }
                }
            },
            
            // Stage 4: Sort by score (highest first) and limit results
            {
                $sort: {
                    skillScore: -1,
                    createdAt: -1 // Newer users get priority in case of tie
                }
            },
            
            // Stage 5: Limit to top 10 results for performance
            {
                $limit: 10
            },
            
            // Stage 6: Project only necessary fields
            {
                $project: {
                    _id: 1,
                    name: 1,
                    email: 1,
                    skills: 1,
                    skillScore: 1,
                    profilePicture: 1,
                    location: 1,
                    language: 1
                }
            }
        ];
        
        // Execute the aggregation
        const potentialMatches = await Users.aggregate(pipeline);
        
        if (potentialMatches.length === 0) {
            return {
                success: false,
                message: 'No suitable users found for skill swap',
                suggestions: []
            };
        }
        
        // Return the best matches with additional metadata
        return {
            success: true,
            message: 'Potential skill swap partners found',
            targetSkill: userA_skill,
            matches: potentialMatches.map(user => ({
                userId: user._id,
                name: user.name,
                email: user.email,
                skills: user.skills,
                skillScore: user.skillScore,
                profilePicture: user.profilePicture,
                location: user.location,
                language: user.language,
                matchReason: getMatchReason(user.skills, normalizedSkill, relatedSkills)
            })),
            totalMatches: potentialMatches.length,
            searchCriteria: {
                targetSkill: userA_skill,
                relatedSkills: relatedSkills,
                searchPattern: searchPattern
            }
        };
        
    } catch (error) {
        console.error('Error in findBestUserB:', error);
        return {
            success: false,
            message: 'Error finding skill swap partners',
            error: error.message
        };
    }
}

/**
 * Helper function to determine why a user was matched
 * @param {Array} userSkills - User's skills
 * @param {string} targetSkill - The skill userA wants to learn
 * @param {Array} relatedSkills - Related skills
 * @returns {string} - Reason for the match
 */
function getMatchReason(userSkills, targetSkill, relatedSkills) {
    const normalizedUserSkills = userSkills.map(skill => skill.toLowerCase());
    
    if (normalizedUserSkills.includes(targetSkill)) {
        return `Exact match: ${targetSkill}`;
    }
    
    if (normalizedUserSkills.some(skill => skill.includes(targetSkill))) {
        return `Partial match: has ${targetSkill} related skills`;
    }
    
    const matchedRelatedSkills = normalizedUserSkills.filter(skill => 
        relatedSkills.includes(skill)
    );
    
    if (matchedRelatedSkills.length > 0) {
        return `Related skills: ${matchedRelatedSkills.join(', ')}`;
    }
    
    return 'Skill similarity match';
}

/**
 * Helper function gets fee of an action
 * @param {*} type 
 * @returns {Promise<Object>}
 */
async function getPlatformCharge(type){
    const platformFee = await PlatformFee.findOne({type: type});
    return platformFee || {};
}

// function getRoomId()

module.exports = { createOrUpdateOTP, createOrUpdateResetOTP, generateReferralCdoe, getDailyReminderTime, isValidCloudinaryUrl, uploadImage, generateInvitationCode, getInviteCode, getIds, getPlatformCharge };
