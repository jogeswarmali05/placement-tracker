const Group = require('../models/Group');
const Subject = require('../models/Subject');
const Report = require('../models/Report');
const Note = require('../models/Note');
const { ApiError, asyncHandler, pick } = require('../utils/helpers');

const FIELDS = ['name', 'description', 'group'];

const assertGroupOwned = async (groupId, userId) => {
  if (!groupId || !(await Group.exists({ _id: groupId, user: userId })))
    throw new ApiError(400, 'Choose a valid group');
};

exports.getSubjects = asyncHandler(async (req, res) => {
  const filter = { user: req.user._id };
  if (req.query.group) filter.group = req.query.group;
  res.json(await Subject.find(filter).populate('group', 'name color').sort('name'));
});

exports.createSubject = asyncHandler(async (req, res) => {
  const data = pick(req.body, FIELDS);
  await assertGroupOwned(data.group, req.user._id);
  const subject = await Subject.create({ ...data, user: req.user._id });
  res.status(201).json(await subject.populate('group', 'name color'));
});

exports.updateSubject = asyncHandler(async (req, res) => {
  const subject = await Subject.findOne({ _id: req.params.id, user: req.user._id });
  if (!subject) throw new ApiError(404, 'Subject not found');
  const data = pick(req.body, FIELDS);
  if (data.group) await assertGroupOwned(data.group, req.user._id);
  Object.assign(subject, data);
  await subject.save();
  res.json(await subject.populate('group', 'name color'));
});

exports.deleteSubject = asyncHandler(async (req, res) => {
  const subject = await Subject.findOne({ _id: req.params.id, user: req.user._id });
  if (!subject) throw new ApiError(404, 'Subject not found');
  await Promise.all([
    Report.deleteMany({ subject: subject._id, user: req.user._id }),
    Note.deleteMany({ subject: subject._id, user: req.user._id }),
    subject.deleteOne(),
  ]);
  res.json({ message: 'Subject and related data deleted' });
});
