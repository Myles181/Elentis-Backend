const mongoose = require('mongoose');

const jobApplicationSchema = new mongoose.Schema({
    job: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Jobs', 
        required: true 
    },
    applicant: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Users', 
        required: true 
    },
    resume: { 
        type: String, 
        required: false 
    }, // Cloudinary URL
    coverLetter: { 
        type: String, 
        required: false,
        maxLength: 2000
    },
    status: { 
        type: String, 
        enum: ['pending', 'reviewed', 'accepted', 'rejected'], 
        default: 'pending' 
    },
    appliedAt: { 
        type: Date, 
        default: Date.now 
    },
    updatedAt: { 
        type: Date, 
        default: Date.now 
    }
}, {
    timestamps: true
});

// Compound index to prevent duplicate applications
jobApplicationSchema.index({ job: 1, applicant: 1 }, { unique: true });

// Index for efficient queries
jobApplicationSchema.index({ applicant: 1, appliedAt: -1 });
jobApplicationSchema.index({ job: 1, appliedAt: -1 });
jobApplicationSchema.index({ status: 1 });

const JobApplication = mongoose.model('JobApplication', jobApplicationSchema);

module.exports = JobApplication;