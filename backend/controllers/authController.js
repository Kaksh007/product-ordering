const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  const exists = await User.findOne({ email });
  if (exists) {
    res.status(409);
    throw new Error('An account with this email already exists');
  }

  const user = await User.create({ name, email, password, role });
  const token = signToken(user);

  res.status(201).json({
    token,
    user: user.toSafeJSON(),
  });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // include password field explicitly, since it is select:false
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  const ok = await user.matchPassword(password);
  if (!ok) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  const token = signToken(user);
  res.json({ token, user: user.toSafeJSON() });
});

// GET /api/auth/me
const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user.toSafeJSON() });
});

// NOTE: A password-reset endpoint was intentionally removed. The previous implementation
// allowed anyone who knew a user's email to set a new password, which is a full account-
// takeover vulnerability. A correct flow needs an emailed, signed, single-use reset token
// with an expiry — which in turn requires email delivery infrastructure (SMTP / Resend /
// SendGrid). Re-introduce it only alongside that infrastructure.

module.exports = { register, login, me };
