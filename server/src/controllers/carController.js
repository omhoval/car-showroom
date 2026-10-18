const asyncHandler = require('../utils/asyncHandler');
const { ok, created, paginated } = require('../utils/response');
const svc = require('../services/carService');

exports.list = asyncHandler(async (req, res) => {
  const { data, meta } = await svc.list(req.query, req.user);
  paginated(res, data, meta);
});
exports.get = asyncHandler(async (req, res) => ok(res, await svc.get(req.params.id, req.user)));
exports.create = asyncHandler(async (req, res) => created(res, await svc.create(req.body, req.user, req.ip)));
exports.update = asyncHandler(async (req, res) => ok(res, await svc.update(req.params.id, req.body, req.user, req.ip)));
exports.changeStatus = asyncHandler(async (req, res) => ok(res, await svc.changeStatus(req.params.id, req.body.status, req.user, req.ip)));
exports.remove = asyncHandler(async (req, res) => {
  await svc.remove(req.params.id, req.user, req.ip);
  ok(res, null, 'Car deleted');
});
