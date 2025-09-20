const Jobs = require('../models/jobs');
const { uploadImage } = require('../utils/helpers');
const JobApplications = require('../models/applications');

const createJob = async (req, res) => {
    try {
        const user = req.user;
        const { title, description, highlights, salary, salaryType,
            jobType, experience, skillsRequired, companyName, 
            location, companyWebsite, status = 'active' } = req.body;
        const companyLogo = req.files ? req.files.companyLogo : null;

        if (!title || !description || !highlights || !salary || !salaryType || !jobType || !experience || !companyName || !location) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required',
                error: 'All fields are required'
            });
        }

        const newJob = new Jobs({
            user: user._id,
            title,
            description,
            highlights,
            salary,
            salaryType,
            jobType,
            experience,
            skillsRequired,
            companyName,
            location,
            companyWebsite,
            status,
        });

        if (companyLogo) {
            const uploadedImage = await uploadImage(companyLogo);
            newJob.companyLogo = uploadedImage.url;
        }

        const savedJob = await newJob.save();
        if (savedJob) {
            return res.status(201).json({
                success: true,
                message: 'Job created successfully',
                job: savedJob
            });
        }
        return res.status(400).json({
            success: false,
            message: 'Failed to create job',
            error: 'Failed to create job'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
}


const getJobs = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const jobs = await Jobs.find({ status: 'active' }, { user: 0, companyLogo: 0, companyName: 0, salary: 0, salaryType: 0, highlights: 0, companyWebsite: 0 })
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ createdAt: -1 })
            .populate('user', 'name email');
        const totalJobs = await Jobs.countDocuments();
        const totalPages = Math.ceil(totalJobs / limit);

        return res.status(200).json({
            success: true,
            message: 'Jobs fetched successfully',
            jobs: jobs,
            totalPages: totalPages,
            currentPage: page,
            totalJobs: totalJobs
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
}

const getJobById = async (req, res) => {
    try {
        const job = await Jobs.findById(req.params.id);
        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Job fetched successfully',
            job: job
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
}

const updateJob = async (req, res) => {
    try {
        const user = req.user;
        const job = await Jobs.findById(req.params.id);
        if (job.user.toString() !== user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to update this job'
            });
        }
        const jobUpdated = await Jobs.findByIdAndUpdate(req.params.id, req.body, { new: true });

        return res.status(200).json({
            success: true,
            message: 'Job updated successfully',
            job: jobUpdated
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
}

const deleteJob = async (req, res) => {
    try {
        const user = req.user;
        const job = await Jobs.findById(req.params.id);
        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }
        if (job.user.toString() !== user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to delete this job'
            });
        }
        await Jobs.findByIdAndUpdate(req.params.id, { status: 'inactive' });
        return res.status(200).json({
            success: true,
            message: 'Job deleted successfully'
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
}

const getJobsByUser = async (req, res) => {
    try {
        const user = req.user;
        const { page = 1, limit = 10 } = req.query;
        const jobs = await Jobs.find({ user: user._id }, { user: -1 })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
        const totalJobs = await Jobs.countDocuments({ user: user._id });
        const totalPages = Math.ceil(totalJobs / limit);

        return res.status(200).json({
            success: true,
            message: 'Jobs fetched successfully',
            jobs: jobs,
            totalPages: totalPages,
            currentPage: page,
            totalJobs: totalJobs
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
}

const getApplicationsForJob = async (req, res) => {
    try {
        const user = req.user;
        const { page = 1, limit = 10 } = req.query;
        const job = await Jobs.findById(req.params.id);
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
        const applications = await JobApplications.find({ job: job._id })
            .sort({ appliedAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('user', 'name email');

        const totalApplications = await JobApplications.countDocuments({ job: job._id });
        const totalPages = Math.ceil(totalApplications / limit);
        return res.status(200).json({
            success: true,
            message: 'Applications fetched successfully',
            applications: applications,
            totalPages: totalPages,
            currentPage: page,
            totalApplications: totalApplications
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
}

module.exports = { createJob, getJobs, getJobById, updateJob, deleteJob, getJobsByUser, getApplicationsForJob };