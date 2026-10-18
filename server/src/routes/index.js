const router = require('express').Router();
const misc = require('./miscRoutes');

router.get('/health', (_req, res) => res.json({ success: true, data: { status: 'ok', uptime: process.uptime() } }));
router.use('/auth', require('./authRoutes'));
router.use('/users', require('./userRoutes'));
router.use('/cars', require('./carRoutes'));
router.use('/customers', require('./customerRoutes'));
router.use('/leads', require('./leadRoutes'));
router.use('/test-drives', require('./testDriveRoutes'));
router.use('/bookings', require('./bookingRoutes'));
router.use('/payments', require('./paymentRoutes'));
router.use('/sales', require('./saleRoutes'));
router.use('/services', require('./serviceRoutes'));
router.use('/dashboard', misc.dashboard);
router.use('/reports', misc.reports);
router.use('/notifications', misc.notifications);
router.use('/audit-logs', misc.auditLogs);

module.exports = router;
