const asyncHandler = require('../utils/asyncHandler');
const { ok, created, paginated } = require('../utils/response');
const svc = require('../services/testDriveService');

exports.list = asyncHandler(async (req, res) => {
  const { data, meta } = await svc.list(req.query, req.user);
  paginated(res, data, meta);
});
exports.get = asyncHandler(async (req, res) => ok(res, await svc.get(req.params.id, req.user)));
exports.create = asyncHandler(async (req, res) => created(res, await svc.create(req.body, req.user)));
exports.update = asyncHandler(async (req, res) => ok(res, await svc.update(req.params.id, req.body, req.user)));
exports.remove = asyncHandler(async (req, res) => {
  await svc.remove(req.params.id);
  ok(res, null, 'Test drive deleted');
});
