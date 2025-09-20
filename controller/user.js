const { Users } = require('../models/users');
const Message = require('../models/messages');;
const Community = require('../models/community');
const { validationResult } = require('express-validator');
const { getDailyReminderTime } = require('../utils/helpers');
const cloudinary = require('cloudinary').v2;

const getUser = async (req, res) => {
    const user = req.user;

    const userData = await Users.findOne({ _id: user._id }, { password: 0 });
    if (!userData) {
        return res.status(400).json({
            success: false,
            message: 'User not found'
        });
    }
    res.status(200).json({
        success: true,
        message: 'User data fetched successfully',
        userData
    });
}

const updateUser = async (req, res) => {
    const { user } = req.user;

    const userExists = await Users.findOne({ _id: user._id });
    if (!userExists) {
        return res.status(400).json({
            success: false,
            message: 'User not found'
        });
    }
    const { name, interest, skills, location, language, dailyReminder, dailyReminderTime } = req.body;
    const { profilePicture } = req.files?.profilePicture || null;
    let {dailyReminderHours, dailyReminderMinutes} = getDailyReminderTime(dailyReminderTime);
    let newDailyReminderTime = `${dailyReminderHours}:${dailyReminderMinutes}`;

    const data = {
        name: name || userExists.name,
        interest: interest || userExists.interest,
        skills: skills || userExists.skills,
        location: location || userExists.location,
        language: language || userExists.language,
        dailyReminder: dailyReminder || userExists.dailyReminder,
        dailyReminderTime: newDailyReminderTime || userExists.dailyReminderTime
    }

    if (profilePicture) {
        const result = await cloudinary.uploader.upload(profilePicture.path);
        data.profilePicture = result.secure_url;
    }

    const userData = await Users.findOneAndUpdate(
        { _id: user._id },
        data,
        { new: true }
    );

    res.status(200).json({
        success: true,
        message: 'User data updated successfully',
        userData
    });
}


module.exports = { getUser, updateUser };


