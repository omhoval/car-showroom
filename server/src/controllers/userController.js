const asyncHandler = require('../utils/asyncHandler');
const { ok, created, paginated } = require('../utils/response');
const svc = require('../services/userService');

exports.list = asyncHandler(async (req, res) => {
  const { data, meta } = await svc.list(req.query, req.user);
  paginated(res, data, meta);
});
exports.create = asyncHandler(async (req, res) => created(res, await svc.create(req.body, req.user, req.ip)));
exports.update = asyncHandler(async (req, res) => ok(res, await svc.update(req.params.id, req.body, req.user, req.ip)));
