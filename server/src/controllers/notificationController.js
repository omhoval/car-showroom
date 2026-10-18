const asyncHandler = require('../utils/asyncHandler');
const { ok, paginated } = require('../utils/response');
const svc = require('../services/notificationService');
const audit = require('../services/auditService');

exports.list = asyncHandler(async (req, res) => {
  const { data, meta } = await svc.list(req.query, req.user);
  paginated(res, data, meta);
});
exports.unreadCount = asyncHandler(async (req, res) => ok(res, { count: await svc.unreadCount(req.user) }));
exports.markRead = asyncHandler(async (req, res) => ok(res, await svc.markRead(req.params.id, req.user)));
exports.markAllRead = asyncHandler(async (req, res) => {
  await svc.markAllRead(req.user);
  ok(res, null);
});
exports.auditLogs = asyncHandler(async (req, res) => {
  const { data, meta } = await audit.list(req.query, req.user);
  paginated(res, data, meta);
});
