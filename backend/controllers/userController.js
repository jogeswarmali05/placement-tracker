const User = require('../models/User');
const { ApiError, asyncHandler, pick } = require('../utils/helpers');

exports.updateProfile = asyncHandler(async (req, res) => {
  const updates = pick(req.body, ['name', 'email', 'graduationYear', 'targetRole', 'college', 'phone']);
  if (updates.email) {
    const taken = await User.findOne({ email: String(updates.email).toLowerCase(), _id: { $ne: req.user._id } });
    if (taken) throw new ApiError(409, 'That email is already in use');
  }
  if (updates.graduationYear === '') updates.graduationYear = undefined;
  const user = await User.findById(req.user._id);
  Object.assign(user, updates);
  await user.save();
  res.json({ user });
});

exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) throw new ApiError(400, 'Current and new password are required');
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.matchPassword(currentPassword))) throw new ApiError(401, 'Current password is incorrect');
  user.password = newPassword; // hashed by pre-save hook; length validated by schema
  await user.save();
  res.json({ message: 'Password updated' });
});
