const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: [true, 'Subject is required'], index: true },
    date: { type: Date, default: Date.now },
    status: { type: String, enum: ['Not Started', 'In Progress', 'Completed'], default: 'In Progress' },
    score: { type: Number, min: [0, 'Score must be 0-100'], max: [100, 'Score must be 0-100'] },
    hoursSpent: { type: Number, min: [0, 'Hours cannot be negative'], max: [24, 'Max 24 hours per entry'], default: 0 },
    remarks: { type: String, trim: true, maxlength: 500 },
    unitName: { type: String, trim: true, maxlength: 120 },
    topicsCovered: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Report', reportSchema);
