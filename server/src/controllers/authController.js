const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, company, role } = req.body;
  if (!name || !email || !password) throw httpError(400, 'Name, email and password are required');
  if (password.length < 8) throw httpError(400, 'Password must be at least 8 characters');

  if (await User.exists({ email: email.toLowerCase() })) {
    throw httpError(409, 'An account with this email already exists');
  }

  const user = await User.create({ name, email, password, company, role });
  res.status(201).json({ token: signToken(user.id), user });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw httpError(400, 'Email and password are required');

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw httpError(401, 'Incorrect email or password');
  }
  res.json({ token: signToken(user.id), user });
});

exports.me = (req, res) => res.json({ user: req.user });
