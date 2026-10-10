const Note = require('../models/Note');
const Subject = require('../models/Subject');
const { ApiError, asyncHandler, pick } = require('../utils/helpers');

const FIELDS = ['subject', 'title', 'content'];

exports.getNotes = asyncHandler(async (req, res) => {
  const filter = { user: req.user._id };
  if (req.query.subject) filter.subject = req.query.subject;
  if (req.query.q) {
    const rx = new RegExp(String(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ title: rx }, { content: rx }];
  }
  res.json(await Note.find(filter).populate('subject', 'name').sort('-updatedAt'));
});

exports.getNote = asyncHandler(async (req, res) => {
  const note = await Note.findOne({ _id: req.params.id, user: req.user._id }).populate('subject', 'name');
  if (!note) throw new ApiError(404, 'Note not found');
  res.json(note);
});

exports.createNote = asyncHandler(async (req, res) => {
  const data = pick(req.body, FIELDS);
  if (!data.subject || !(await Subject.exists({ _id: data.subject, user: req.user._id })))
    throw new ApiError(400, 'Choose a valid subject');
  const note = await Note.create({ ...data, user: req.user._id });
  res.status(201).json(await note.populate('subject', 'name'));
});

exports.updateNote = asyncHandler(async (req, res) => {
  const note = await Note.findOne({ _id: req.params.id, user: req.user._id });
  if (!note) throw new ApiError(404, 'Note not found');
  const data = pick(req.body, FIELDS);
  if (data.subject && !(await Subject.exists({ _id: data.subject, user: req.user._id })))
    throw new ApiError(400, 'Choose a valid subject');
  Object.assign(note, data);
  await note.save();
  res.json(await note.populate('subject', 'name'));
});

exports.deleteNote = asyncHandler(async (req, res) => {
  const note = await Note.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!note) throw new ApiError(404, 'Note not found');
  res.json({ message: 'Note deleted' });
});
