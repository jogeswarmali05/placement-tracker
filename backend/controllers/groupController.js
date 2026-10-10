const Group = require('../models/Group');
const Subject = require('../models/Subject');
const Report = require('../models/Report');
const Note = require('../models/Note');
const { ApiError, asyncHandler, pick } = require('../utils/helpers');

const FIELDS = ['name', 'description', 'color'];

exports.getGroups = asyncHandler(async (req, res) => {
  res.json(await Group.find({ user: req.user._id }).sort('createdAt'));
});

exports.createGroup = asyncHandler(async (req, res) => {
  res.status(201).json(await Group.create({ ...pick(req.body, FIELDS), user: req.user._id }));
});

exports.updateGroup = asyncHandler(async (req, res) => {
  const group = await Group.findOne({ _id: req.params.id, user: req.user._id });
  if (!group) throw new ApiError(404, 'Group not found');
  Object.assign(group, pick(req.body, FIELDS));
  res.json(await group.save());
});

// Deleting a group cascades to its subjects, reports and notes
exports.deleteGroup = asyncHandler(async (req, res) => {
  const group = await Group.findOne({ _id: req.params.id, user: req.user._id });
  if (!group) throw new ApiError(404, 'Group not found');
  const ids = (await Subject.find({ group: group._id, user: req.user._id }).select('_id')).map((s) => s._id);
  await Promise.all([
    Report.deleteMany({ subject: { $in: ids }, user: req.user._id }),
    Note.deleteMany({ subject: { $in: ids }, user: req.user._id }),
    Subject.deleteMany({ _id: { $in: ids } }),
    group.deleteOne(),
  ]);
  res.json({ message: 'Group and related data deleted' });
});
