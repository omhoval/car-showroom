const env = require('../config/env');
const asyncHandler = require('../utils/asyncHandler');
const { ok, created } = require('../utils/response');
const svc = require('../services/authService');

const cookieOpts = {
  httpOnly: true,
  sameSite: 'lax',
  path: '/api/auth',
  secure: env.COOKIE_SECURE,
  maxAge: env.REFRESH_TOKEN_TTL_DAYS * 86400000,
};
const meta = (req) => ({ ip: req.ip, userAgent: req.headers['user-agent'] });
const setCookie = (res, token) => res.cookie('refreshToken', token, cookieOpts);

exports.register = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await svc.register(req.body, meta(req));
  setCookie(res, refreshToken);
  created(res, { user, accessToken });
});

exports.login = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await svc.login(req.body, meta(req));
  setCookie(res, refreshToken);
  ok(res, { user, accessToken });
});

exports.refresh = asyncHandler(async (req, res) => {
  try {
    const { user, accessToken, refreshToken } = await svc.refresh(req.cookies.refreshToken, meta(req));
    setCookie(res, refreshToken);
    ok(res, { user, accessToken });
  } catch (err) {
    res.clearCookie('refreshToken', { ...cookieOpts, maxAge: undefined });
    throw err;
  }
});

exports.logout = asyncHandler(async (req, res) => {
  await svc.logout(req.cookies.refreshToken);
  res.clearCookie('refreshToken', { ...cookieOpts, maxAge: undefined });
  ok(res, null, 'Logged out');
});

exports.forgotPassword = asyncHandler(async (req, res) => {
  await svc.forgotPassword(req.body);
  ok(res, null, 'If the email exists, a reset link has been sent');
});

exports.resetPassword = asyncHandler(async (req, res) => {
  await svc.resetPassword(req.body);
  ok(res, null, 'Password updated. Please log in again.');
});

exports.me = asyncHandler(async (req, res) => ok(res, { user: await svc.me(req.user.id) }));
