const mongoose = require('mongoose');

const JobApplicationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    status: { type: String, required: true, enum: ['pending', 'shortlisted', 'rejected'] },
    resume: { type: String, required: true },
    coverLetter: { type: String, required: true },
    yearsOfExperience: { type: Number, required: true },
    appliedAt: { type: Date, default: Date.now },
});

JobApplicationSchema.index({ user: 1, job: 1 }, { unique: true });

const JobApplications = mongoose.model('JobApplications', JobApplicationSchema);
module.exports = JobApplications;