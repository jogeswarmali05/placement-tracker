const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { ApiError, asyncHandler, pick } = require('../utils/helpers');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

exports.register = asyncHandler(async (req, res) => {
  const data = pick(req.body, ['name', 'email', 'password', 'graduationYear', 'targetRole', 'college']);
  if (data.graduationYear === '') delete data.graduationYear;
  if (await User.findOne({ email: String(data.email || '').toLowerCase() }))
    throw new ApiError(409, 'An account with this email already exists');
  const user = await User.create(data);
  res.status(201).json({ token: signToken(user._id), user });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, 'Email and password are required');
  const user = await User.findOne({ email: String(email).toLowerCase() }).select('+password');
  if (!user || !(await user.matchPassword(password))) throw new ApiError(401, 'Invalid email or password');
  res.json({ token: signToken(user._id), user });
});

exports.getMe = asyncHandler(async (req, res) => res.json({ user: req.user }));
