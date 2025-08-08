const mongoose = require('mongoose');

const UserCoursesSchema = new mongoose.Schema({
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Courses', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true },
    status: { type: String, required: true, enum: ['completed', 'in_progress'] },
    saved: { type: Boolean, required: true, default: false },
    progress: { type: Number, required: true, default: 0 },
    watchedSections: { type: [String], required: false },
    currentWatchTime: { type: Number, required: false },
    completedAt: { type: Date, required: false },
    savedAt: { type: Date, required: false },
    createdAt: { type: Date, default: Date.now }
});

const UserCourses = mongoose.model('UserCourses', UserCoursesSchema);
module.exports = { UserCourses }; 