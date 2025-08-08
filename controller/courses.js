const { Users } = require('../models/users');
const { Courses } = require('../models/courses');
const { UserCourses } = require('../models/userCourses');
const { validationResult } = require('express-validator');
const { getDailyReminderTime } = require('../utils/helpers');
const cloudinary = require('cloudinary').v2;

const getCourses = async (req, res) => {
    const user = req.user;

    const courses = await Courses.find({});
    if (!courses) {
        return res.status(400).json({
            success: false,
            message: 'No courses found'
        });
    }
    res.status(200).json({
        success: true,
        message: 'Courses fetched successfully',
        courses
    });
}

const getCourseById = async (req, res) => {
    const { id } = req.params;
    const course = await Courses.findById(id);
    if (!course) {
        return res.status(400).json({
            success: false,
            message: 'Course not found'
        });
    }
    res.status(200).json({
        success: true,
        message: 'Course fetched successfully',
        course
    });
}

const getUserCourses = async (req, res) => {
    const user = req.user;
    const userCourses = await UserCourses.find({ userId: user._id });
    if (!userCourses) {
        return res.status(400).json({
            success: false,
            message: 'No courses found'
        });
    }
    res.status(200).json({
        success: true,
        message: 'User courses fetched successfully',
        userCourses
    });
}


const getUserCourseById = async (req, res) => {
    const { id } = req.params;
    const userCourse = await UserCourses.findById(id);
    if (!userCourse) {
        return res.status(400).json({
            success: false,
            message: 'Course not found'
        });
    }
}

const createCourse = async (req, res) => {
    try {
        const user = req.user;
    const { title, subtitle, language, skills, courseType, payAmount, image, sections, expectedDuration, public } = req.body;

        // Validate required fields
        if (!title || !subtitle || !language || !courseType || !payAmount || !image || !expectedDuration) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: title, subtitle, language, courseType, payAmount, image, expectedDuration'
            });
        }

        // Validate skills array
        if (!skills || !Array.isArray(skills) || skills.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Skills must be a non-empty array'
            });
        }

        // Validate each skill
        for (let i = 0; i < skills.length; i++) {
            const skill = skills[i];
            if (!skill || typeof skill !== 'object' || !skill.name || typeof skill.name !== 'string' || skill.name.trim() === '') {
                return res.status(400).json({
                    success: false,
                    message: `Invalid skill at index ${i}. Each skill must have a valid name property`
                });
            }
            // Clean the skill name
            skills[i].name = skill.name.trim();
        }

        // Validate sections array
        if (!sections || !Array.isArray(sections) || sections.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Sections must be a non-empty array'
            });
        }

        // Validate each section and check for article/videoUrl requirement
        let totalWatchTime = 0;
        let hasValidContent = false;

        for (let i = 0; i < sections.length; i++) {
            const section = sections[i];
            
            // Validate required fields
            if (!section.name || typeof section.name !== 'string' || section.name.trim() === '') {
                return res.status(400).json({
                    success: false,
                    message: `Section ${i + 1}: name is required and must be a non-empty string`
                });
            }

            if (!section.title || typeof section.title !== 'string' || section.title.trim() === '') {
                return res.status(400).json({
                    success: false,
                    message: `Section ${i + 1}: title is required and must be a non-empty string`
                });
            }

            // Clean the section data
            sections[i].name = section.name.trim();
            sections[i].title = section.title.trim();

            // Validate article (optional)
            if (section.article !== undefined && section.article !== null) {
                if (typeof section.article !== 'string') {
                    return res.status(400).json({
                        success: false,
                        message: `Section ${i + 1}: article must be a string`
                    });
                }
                sections[i].article = section.article.trim();
                if (section.article.trim() !== '') {
                    hasValidContent = true;
                }
            }

            // Validate videoUrl (optional but must be cloudinary URL if provided)
            if (section.videoUrl !== undefined && section.videoUrl !== null) {
                if (typeof section.videoUrl !== 'string') {
                    return res.status(400).json({
                        success: false,
                        message: `Section ${i + 1}: videoUrl must be a string`
                    });
                }
                
                const videoUrl = section.videoUrl.trim();
                if (videoUrl !== '') {
                    // Validate cloudinary URL
                    const { isValidCloudinaryUrl } = require('../utils/helpers');
                    if (!isValidCloudinaryUrl(videoUrl)) {
                        return res.status(400).json({
                            success: false,
                            message: `Section ${i + 1}: videoUrl must be a valid Cloudinary URL`
                        });
                    }
                    sections[i].videoUrl = videoUrl;
                    hasValidContent = true;
                }
            }

            // Validate watchTime (optional)
            if (section.watchTime !== undefined && section.watchTime !== null) {
                if (typeof section.watchTime !== 'number' || section.watchTime < 0) {
                    return res.status(400).json({
                        success: false,
                        message: `Section ${i + 1}: watchTime must be a non-negative number`
                    });
                }
                totalWatchTime += section.watchTime;
            }
        }

        // Ensure at least one section has either article or videoUrl
        if (!hasValidContent) {
            return res.status(400).json({
                success: false,
                message: 'At least one section must have either article or videoUrl content'
            });
        }

        // Validate payAmount
        if (typeof payAmount !== 'number' || payAmount < 0) {
            return res.status(400).json({
                success: false,
                message: 'payAmount must be a non-negative number'
            });
        }

        // Validate image (should be cloudinary URL)
        const { isValidCloudinaryUrl } = require('../utils/helpers');
        if (!isValidCloudinaryUrl(image)) {
            return res.status(400).json({
                success: false,
                message: 'image must be a valid Cloudinary URL'
            });
        }

        // Check if course already exists
        const existingCourse = await Courses.findOne({ title });
        if (existingCourse) {
        return res.status(400).json({
            success: false,
            message: 'Course already exists'
        });
    }

        // Create the course
        const courseData = {
            title: title.trim(),
            subtitle: subtitle.trim(),
            language: language.trim(),
            skills,
            courseType: courseType.trim(),
            payAmount,
            image,
            sections,
            expectedDuration: expectedDuration.trim(),
            totalWatchTime,
            public: public !== undefined ? public : true,
            authorBy: user._id || user.id
        };

        const course = await Courses.create(courseData);
        
        res.status(201).json({
        success: true,
        message: 'Course created successfully',
        course
    });

    } catch (error) {
        console.error('Error creating course:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
}

const updateCourse = async (req, res) => {
    try {
        const user = req.user;
        const { id } = req.params;
        const { title, subtitle, language, skills, courseType, payAmount, image, sections, expectedDuration, public } = req.body;

        // Check if course exists and belongs to the user
        const existingCourse = await Courses.findById(id);
        if (!existingCourse) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Check if user is the author of the course
        if (existingCourse.authorBy.toString() !== user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to update this course'
            });
        }

        // Validate required fields if provided
        if (title !== undefined && (!title || typeof title !== 'string' || title.trim() === '')) {
            return res.status(400).json({
                success: false,
                message: 'title must be a non-empty string'
            });
        }

        if (subtitle !== undefined && (!subtitle || typeof subtitle !== 'string' || subtitle.trim() === '')) {
            return res.status(400).json({
                success: false,
                message: 'subtitle must be a non-empty string'
            });
        }

        if (language !== undefined && (!language || typeof language !== 'string' || language.trim() === '')) {
            return res.status(400).json({
                success: false,
                message: 'language must be a non-empty string'
            });
        }

        if (courseType !== undefined && (!courseType || typeof courseType !== 'string' || courseType.trim() === '')) {
            return res.status(400).json({
                success: false,
                message: 'courseType must be a non-empty string'
            });
        }

        if (expectedDuration !== undefined && (!expectedDuration || typeof expectedDuration !== 'string' || expectedDuration.trim() === '')) {
            return res.status(400).json({
                success: false,
                message: 'expectedDuration must be a non-empty string'
            });
        }

        // Validate skills array if provided
        if (skills !== undefined) {
            if (!Array.isArray(skills) || skills.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Skills must be a non-empty array'
                });
            }

            // Validate each skill
            for (let i = 0; i < skills.length; i++) {
                const skill = skills[i];
                if (!skill || typeof skill !== 'object' || !skill.name || typeof skill.name !== 'string' || skill.name.trim() === '') {
                    return res.status(400).json({
                        success: false,
                        message: `Invalid skill at index ${i}. Each skill must have a valid name property`
                    });
                }
                // Clean the skill name
                skills[i].name = skill.name.trim();
            }
        }

        // Validate sections array if provided
        if (sections !== undefined) {
            if (!Array.isArray(sections) || sections.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Sections must be a non-empty array'
                });
            }

            // Validate each section and check for article/videoUrl requirement
            let totalWatchTime = 0;
            let hasValidContent = false;

            for (let i = 0; i < sections.length; i++) {
                const section = sections[i];
                
                // Validate required fields
                if (!section.name || typeof section.name !== 'string' || section.name.trim() === '') {
                    return res.status(400).json({
                        success: false,
                        message: `Section ${i + 1}: name is required and must be a non-empty string`
                    });
                }

                if (!section.title || typeof section.title !== 'string' || section.title.trim() === '') {
                    return res.status(400).json({
                        success: false,
                        message: `Section ${i + 1}: title is required and must be a non-empty string`
                    });
                }

                // Clean the section data
                sections[i].name = section.name.trim();
                sections[i].title = section.title.trim();

                // Validate article (optional)
                if (section.article !== undefined && section.article !== null) {
                    if (typeof section.article !== 'string') {
                        return res.status(400).json({
                            success: false,
                            message: `Section ${i + 1}: article must be a string`
                        });
                    }
                    sections[i].article = section.article.trim();
                    if (section.article.trim() !== '') {
                        hasValidContent = true;
                    }
                }

                // Validate videoUrl (optional but must be cloudinary URL if provided)
                if (section.videoUrl !== undefined && section.videoUrl !== null) {
                    if (typeof section.videoUrl !== 'string') {
                        return res.status(400).json({
                            success: false,
                            message: `Section ${i + 1}: videoUrl must be a string`
                        });
                    }
                    
                    const videoUrl = section.videoUrl.trim();
                    if (videoUrl !== '') {
                        // Validate cloudinary URL
                        const { isValidCloudinaryUrl } = require('../utils/helpers');
                        if (!isValidCloudinaryUrl(videoUrl)) {
                            return res.status(400).json({
                                success: false,
                                message: `Section ${i + 1}: videoUrl must be a valid Cloudinary URL`
                            });
                        }
                        sections[i].videoUrl = videoUrl;
                        hasValidContent = true;
                    }
                }

                // Validate watchTime (optional)
                if (section.watchTime !== undefined && section.watchTime !== null) {
                    if (typeof section.watchTime !== 'number' || section.watchTime < 0) {
                        return res.status(400).json({
                            success: false,
                            message: `Section ${i + 1}: watchTime must be a non-negative number`
                        });
                    }
                    totalWatchTime += section.watchTime;
                }
            }

            // Ensure at least one section has either article or videoUrl
            if (!hasValidContent) {
                return res.status(400).json({
                    success: false,
                    message: 'At least one section must have either article or videoUrl content'
                });
            }
        }

        // Validate payAmount if provided
        if (payAmount !== undefined && (typeof payAmount !== 'number' || payAmount < 0)) {
            return res.status(400).json({
                success: false,
                message: 'payAmount must be a non-negative number'
            });
        }

        // Validate image if provided (should be cloudinary URL)
        if (image !== undefined) {
            const { isValidCloudinaryUrl } = require('../utils/helpers');
            if (!isValidCloudinaryUrl(image)) {
                return res.status(400).json({
                    success: false,
                    message: 'image must be a valid Cloudinary URL'
                });
            }
        }

        // Check if title is being updated and if it conflicts with existing course
        if (title && title.trim() !== existingCourse.title) {
            const titleConflict = await Courses.findOne({ 
                title: title.trim(), 
                _id: { $ne: id } 
            });
            if (titleConflict) {
                return res.status(400).json({
                    success: false,
                    message: 'A course with this title already exists'
                });
            }
        }

        // Prepare update data
        const updateData = {};
        
        if (title !== undefined) updateData.title = title.trim();
        if (subtitle !== undefined) updateData.subtitle = subtitle.trim();
        if (language !== undefined) updateData.language = language.trim();
        if (skills !== undefined) updateData.skills = skills;
        if (courseType !== undefined) updateData.courseType = courseType.trim();
        if (payAmount !== undefined) updateData.payAmount = payAmount;
        if (image !== undefined) updateData.image = image;
        if (sections !== undefined) {
            updateData.sections = sections;
            // Calculate total watch time from sections
            let totalWatchTime = 0;
            sections.forEach(section => {
                if (section.watchTime && typeof section.watchTime === 'number') {
                    totalWatchTime += section.watchTime;
                }
            });
            updateData.totalWatchTime = totalWatchTime;
        }
        if (expectedDuration !== undefined) updateData.expectedDuration = expectedDuration.trim();
        if (public !== undefined) updateData.public = public;

        // Update the course
        const updatedCourse = await Courses.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: 'Course updated successfully',
            course: updatedCourse
        });

    } catch (error) {
        console.error('Error updating course:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
}

const enrollCourse = async (req, res) => {
    const user = req.user;
    const { saved = false } = req.body;
    const { courseId } = req.params;
    const course = await Courses.findById(courseId);
    if (!course) {
        return res.status(400).json({
            success: false,
            message: 'Course not found'
        });
    }
    if (course.public === false) {
        return res.status(400).json({
            success: false,
            message: 'This course is not public'
        });
    }
    const userCourse = await UserCourses.findOne({
        userId: user._id,
        courseId: course._id
    });
    if (userCourse) {
        return res.status(400).json({
            success: false,
            message: 'You are already enrolled in this course'
        });
    }

    // Check if status is "saved", User won't have to pay for the course because they haven't paid for it 
    // Check if user has enough balance in wallet
    // if not, error
    // TODO: Add wallet balance check

    const newUserCourse = await UserCourses.create({
        userId: user._id,
        courseId: course._id,
        saved: saved
    });
    if (newUserCourse) {
        return res.status(200).json({
            success: true,
            message: 'You are enrolled in this course'
        });
    }
    return res.status(400).json({
        success: false,
        message: 'Failed to enroll in this course'
    });
}


module.exports = { getCourses, getCourseById, getUserCourses, getUserCourseById, createCourse, updateCourse, enrollCourse };
