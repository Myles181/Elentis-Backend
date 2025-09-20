const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    highlights: { type: [String], required: true },
    salary: { type: Number, required: true },
    salaryType: { type: String, required: true, enum: ['hourly', 'monthly', 'yearly'] },
    jobType: { type: String, required: true, enum: ['full_time', 'part_time', 'remote', 'hybrid', 'freelance', 'internship'] },
    experience: { type: String, required: true, enum: ['entry', 'mid', 'senior'] },
    skillsRequired: { type: [String], required: false },
    companyName: { type: String, required: true },
    companyLogo: { type: String, required: false },
    location: { type: String, required: true },
    companyWebsite: { type: String, required: false },
    status: { type: String, required: true, enum: ['active', 'inactive'] },
    isFeatured: { type: Boolean, required: false, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

const Jobs = mongoose.model('Jobs', JobSchema);

module.exports = Jobs;