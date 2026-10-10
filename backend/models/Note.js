const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: [true, 'Subject is required'], index: true },
    title: { type: String, required: [true, 'Title is required'], trim: true, maxlength: 120 },
    content: { type: String, default: '', maxlength: 50000 }, // markdown
  },
  { timestamps: true }
);

module.exports = mongoose.model('Note', noteSchema);
