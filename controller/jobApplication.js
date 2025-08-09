const JobApplication = require('../models/jobApplication');
const Jobs = require('../models/jobs');

const applyForJob = async (req, res) => {
    try {
        const user = req.user;
        const { jobId } = req.params;
        const { coverLetter } = req.body;
        const resume = req.file ? req.file : null;

        // Check if job exists and is active
        const job = await Jobs.findById(jobId);
        if (!job || job.status !== 'active') {
            return res.status(404).json({
                success: false,
                message: 'Job not found or no longer active'
            });
        }

        // Check if user already applied for this job
        const existingApplication = await JobApplication.findOne({
            job: jobId,
            applicant: user._id
        });

        if (existingApplication) {
            return res.status(400).json({
                success: false,
                message: 'You have already applied for this job'
            });
        }

        // Create application
        const applicationData = {
            job: jobId,
            applicant: user._id,
            coverLetter: coverLetter || ''
        };

        // Handle resume upload if provided
        if (resume) {
            const { uploadImage } = require('../utils/helpers');
            const uploadResult = await uploadImage(resume);
            applicationData.resume = uploadResult.url;
        }

        const application = await JobApplication.create(applicationData);

        // Update job application count (if you have analytics)
        await Jobs.findByIdAndUpdate(jobId, { $inc: { applicationCount: 1 } });

        return res.status(201).json({
            success: true,
            message: 'Application submitted successfully',
            application: {
                id: application._id,
                jobId: application.job,
                status: application.status,
                appliedAt: application.appliedAt
            }
        });

    } catch (error) {
        console.error('Job application error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

const getMyApplications = async (req, res) => {
    try {
        const user = req.user;
        const { page = 1, limit = 10 } = req.query;

        const applications = await JobApplication.find({ applicant: user._id })
            .populate('job', 'title companyName location jobType salary status')
            .sort({ appliedAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const totalApplications = await JobApplication.countDocuments({ applicant: user._id });
        const totalPages = Math.ceil(totalApplications / limit);

        return res.status(200).json({
            success: true,
            message: 'Applications fetched successfully',
            applications,
            pagination: {
                totalApplications,
                totalPages,
                currentPage: parseInt(page),
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        });

    } catch (error) {
        console.error('Get applications error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

const getJobApplications = async (req, res) => {
    try {
        const user = req.user;
        const { jobId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        // Check if user owns the job
        const job = await Jobs.findById(jobId);
        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }

        if (job.user.toString() !== user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to view applications for this job'
            });
        }

        const applications = await JobApplication.find({ job: jobId })
            .populate('applicant', 'name email profilePicture skills')
            .sort({ appliedAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const totalApplications = await JobApplication.countDocuments({ job: jobId });
        const totalPages = Math.ceil(totalApplications / limit);

        return res.status(200).json({
            success: true,
            message: 'Job applications fetched successfully',
            applications,
            job: {
                id: job._id,
                title: job.title,
                companyName: job.companyName
            },
            pagination: {
                totalApplications,
                totalPages,
                currentPage: parseInt(page),
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        });

    } catch (error) {
        console.error('Get job applications error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

const updateApplicationStatus = async (req, res) => {
    try {
        const user = req.user;
        const { applicationId } = req.params;
        const { status } = req.body;

        if (!['pending', 'reviewed', 'accepted', 'rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be: pending, reviewed, accepted, or rejected'
            });
        }

        const application = await JobApplication.findById(applicationId).populate('job');
        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        // Check if user owns the job
        if (application.job.user.toString() !== user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to update this application'
            });
        }

        application.status = status;
        await application.save();

        return res.status(200).json({
            success: true,
            message: 'Application status updated successfully',
            application: {
                id: application._id,
                status: application.status,
                updatedAt: application.updatedAt
            }
        });

    } catch (error) {
        console.error('Update application status error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

const deleteApplication = async (req, res) => {
    try {
        const user = req.user;
        const { applicationId } = req.params;

        const application = await JobApplication.findById(applicationId);
        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        // Check if user owns the application
        if (application.applicant.toString() !== user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to delete this application'
            });
        }

        await JobApplication.findByIdAndDelete(applicationId);

        // Decrease job application count
        await Jobs.findByIdAndUpdate(application.job, { $inc: { applicationCount: -1 } });

        return res.status(200).json({
            success: true,
            message: 'Application deleted successfully'
        });

    } catch (error) {
        console.error('Delete application error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

module.exports = {
    applyForJob,
    getMyApplications,
    getJobApplications,
    updateApplicationStatus,
    deleteApplication
};