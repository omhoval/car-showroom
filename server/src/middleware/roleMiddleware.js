const PERMISSIONS = require('../constants/permissions');
const ApiError = require('../utils/ApiError');

exports.authorize = (...perms) => (req, _res, next) => {
  if (!req.user) return next(new ApiError('UNAUTHENTICATED'));
  const allowed = perms.some((p) => (PERMISSIONS[p] || []).includes(req.user.role));
  return next(allowed ? undefined : new ApiError('FORBIDDEN'));
};
