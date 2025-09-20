const SkillSwap = require("../models/skillSwap");
const { findBestUserB } = require("../utils/helpers");

const createSkillSwap = async (req, res) => {
    try {
        const userA = req.user;
        const { userA_skill, userB_skill, userA_proficiencyLevel, userA_experienceLevel } = req.body;

        // Validate required fields
        if (!userA_skill || !userA_proficiencyLevel || !userA_experienceLevel) {
            return res.status(400).json({
                success: false,
                message: 'userA_skill, userA_proficiencyLevel, and userA_experienceLevel are required'
            });
        }

        // Create the skill swap request
        const skillSwap = await SkillSwap.create({ 
            userA: userA._id, 
            userA_skill, 
            userB_skill, 
            userA_proficiencyLevel, 
            userA_experienceLevel 
        });

        // Find the best userB for the skillSwap
        const bestMatches = await findBestUserB(userA_skill, userA_proficiencyLevel, userA_experienceLevel);

        return res.status(201).json({
            success: true,
            message: 'Skill swap request created successfully',
            skillSwap: {
                id: skillSwap._id,
                userA_skill: skillSwap.userA_skill,
                userB_skill: skillSwap.userB_skill,
                userA_proficiencyLevel: skillSwap.userA_proficiencyLevel,
                userA_experienceLevel: skillSwap.userA_experienceLevel,
                status: skillSwap.status,
                createdAt: skillSwap.createdAt
            },
            potentialPartners: bestMatches
        });

    } catch (error) {
        console.error('Error creating skill swap:', error);
        return res.status(500).json({ 
            success: false,
            message: 'Internal server error',
            error: error.message 
        });
    }
}

module.exports = {
    createSkillSwap
};