const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: [true, 'Group is required'], index: true },
    name: { type: String, required: [true, 'Subject name is required'], trim: true, maxlength: 80 },
    description: { type: String, trim: true, maxlength: 300 },
  },
  { timestamps: true }
);
subjectSchema.index({ user: 1, group: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Subject', subjectSchema);
