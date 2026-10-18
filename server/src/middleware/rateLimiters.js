const rateLimit = require('express-rate-limit');
const env = require('../config/env');

const handler = (_req, res) =>
  res.status(429).json({ success: false, message: 'Too many requests', errorCode: 'RATE_LIMITED' });

exports.globalRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MIN * 60 * 1000,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

exports.authRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MIN * 60 * 1000,
  max: env.AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});
