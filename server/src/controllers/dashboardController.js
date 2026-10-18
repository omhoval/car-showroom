const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/response');
const dashboard = require('../services/dashboardService');
const reports = require('../services/reportService');

exports.dashboard = asyncHandler(async (req, res) => ok(res, await dashboard.get(req.user)));
exports.salesReport = asyncHandler(async (req, res) => ok(res, await reports.sales(req.query)));
exports.inventoryReport = asyncHandler(async (_req, res) => ok(res, await reports.inventory()));
exports.employeeReport = asyncHandler(async (req, res) => ok(res, await reports.employees(req.query)));
