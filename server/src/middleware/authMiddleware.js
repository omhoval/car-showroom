const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

exports.authenticate = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) throw new ApiError('UNAUTHENTICATED');
  const payload = jwt.verify(header.slice(7), env.JWT_ACCESS_SECRET, { algorithms: ['HS256'] });
  const user = await User.findById(payload.sub).select('role isActive customerId name');
  if (!user) throw new ApiError('UNAUTHENTICATED');
  if (!user.isActive) throw new ApiError('ACCOUNT_DISABLED');
  req.user = { id: String(user._id), role: user.role, customerId: user.customerId ? String(user.customerId) : null, name: user.name };
  next();
});
