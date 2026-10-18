const asyncHandler = require('../utils/asyncHandler');
const { ok, created, paginated } = require('../utils/response');
const svc = require('../services/paymentService');

exports.list = asyncHandler(async (req, res) => {
  const { data, meta } = await svc.list(req.query, req.user);
  paginated(res, data, meta);
});
exports.create = asyncHandler(async (req, res) => created(res, await svc.record(req.body, req.user, req.ip)));
exports.verify = asyncHandler(async (req, res) => ok(res, await svc.verify(req.params.id, req.body, req.user, req.ip)));
exports.refund = asyncHandler(async (req, res) => created(res, await svc.refund(req.params.id, req.body, req.user, req.ip)));
