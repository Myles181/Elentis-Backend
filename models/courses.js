const mongoose = require('mongoose');

const CourseSkillSchema = new mongoose.Schema({
    name: { type: String, required: true },
});

const CourseSectionSchema = new mongoose.Schema({
    name: { type: String, required: true },
    title: { type: String, required: true },
    article: { type: String, required: false },
    videoUrl: { type: String, required: false },
    watchTime: { type: Number, required: false },
    // quiz: { type: [CourseQuizSchema], required: true },
});


const CoursesSchema = new mongoose.Schema({
    title: { type: String, required: true },
    subtitle: { type: String, required: true },
    language: { type: String, required: true },
    expectedDuration: { type: String, required: true },
    skills: { type: [CourseSkillSchema], required: true },
    courseType: { type: String, required: true },
    payAmount: { type: Number, required: true },
    image: { type: String, required: true },
    totalWatchTime: { type: Number, required: true },
    sections: { type: [CourseSectionSchema], required: true },
    public: { type: Boolean, default: true },
    authorBy: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const Courses = mongoose.model('Courses', CoursesSchema);
module.exports = { Courses }; 