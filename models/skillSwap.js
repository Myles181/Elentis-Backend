const mongoose = require('mongoose');

const SkillSwapSchema = new mongoose.Schema({
    userA: { type: mongoose.Schema.Types.ObjectId, ref: 'Users' },
    userB: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: false },
    userA_skill: { type: String, required: true },
    userB_skill: { type: String, required: false },
    userA_proficiencyLevel: { type: String, enum: ['begineer', 'novice', 'intermediate', 'advance', 'expert'], required: true },
    userA_experienceLevel: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'accepted', 'rejected', 'completed'], default: 'pending' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
})

const SkillSwap = mongoose.model('SkillSwap', SkillSwapSchema);

module.exports = SkillSwap;


