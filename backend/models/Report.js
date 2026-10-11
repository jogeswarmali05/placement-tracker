const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: [true, 'Subject is required'], index: true },
    startDate: { type: Date, required: [true, 'Start date is required'] },
    endDate: {
      type: Date,
      validate: {
        validator(v) { return !v || !this.startDate || v >= this.startDate; },
        message: 'End date cannot be before start date',
      },
    },
    status: { type: String, enum: ['Not Started', 'In Progress', 'Completed'], default: 'In Progress' },
    score: { type: Number, min: [0, 'Score must be 0-100'], max: [100, 'Score must be 0-100'] },
    hoursSpent: { type: Number, min: [0, 'Hours cannot be negative'], max: [1000, 'Hours look too high'], default: 0 },
    remarks: { type: String, trim: true, maxlength: 500 },
    unitName: { type: String, trim: true, maxlength: 120 },
    topicsCovered: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Report', reportSchema);