const express = require('express');
const dash = require('../controllers/dashboardController');
const notif = require('../controllers/notificationController');
const { idParam, listQuery } = require('../validators/common');
const { validate } = require('../middleware/validationMiddleware');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const dashboard = express.Router();
dashboard.get('/', authenticate, authorize('dashboard:read'), dash.dashboard);

const reports = express.Router();
reports.use(authenticate, authorize('reports:read'));
reports.get('/sales', dash.salesReport);
reports.get('/inventory', dash.inventoryReport);
reports.get('/employees', dash.employeeReport);

const notifications = express.Router();
notifications.use(authenticate, authorize('notifications:read'));
notifications.get('/', validate({ query: listQuery }), notif.list);
notifications.get('/unread-count', notif.unreadCount);
notifications.patch('/read-all', notif.markAllRead);
notifications.patch('/:id/read', validate({ params: idParam }), notif.markRead);

const auditLogs = express.Router();
auditLogs.get('/', authenticate, authorize('auditLogs:read'), validate({ query: listQuery }), notif.auditLogs);

module.exports = { dashboard, reports, notifications, auditLogs };
