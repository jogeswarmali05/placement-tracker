const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: [true, 'Group name is required'], trim: true, maxlength: 60 },
    description: { type: String, trim: true, maxlength: 300 },
    color: { type: String, default: '#0f766e' },
  },
  { timestamps: true }
);
groupSchema.index({ user: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Group', groupSchema);
