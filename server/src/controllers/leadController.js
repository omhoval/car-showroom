const asyncHandler = require('../utils/asyncHandler');
const { ok, created, paginated } = require('../utils/response');
const svc = require('../services/leadService');

exports.list = asyncHandler(async (req, res) => {
  const { data, meta } = await svc.list(req.query, req.user);
  paginated(res, data, meta);
});
exports.get = asyncHandler(async (req, res) => ok(res, await svc.get(req.params.id, req.user)));
exports.create = asyncHandler(async (req, res) => created(res, await svc.create(req.body, req.user, req.ip)));
exports.update = asyncHandler(async (req, res) => ok(res, await svc.update(req.params.id, req.body, req.user, req.ip)));
exports.assign = asyncHandler(async (req, res) => ok(res, await svc.assign(req.params.id, req.body.assignedEmployeeId, req.user, req.ip)));
exports.addNote = asyncHandler(async (req, res) => created(res, await svc.addNote(req.params.id, req.body.text, req.user)));
exports.remove = asyncHandler(async (req, res) => {
  await svc.remove(req.params.id, req.user, req.ip);
  ok(res, null, 'Lead deleted');
});
