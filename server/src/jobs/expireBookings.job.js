const cron = require('node-cron');
const Booking = require('../models/Booking');
const logger = require('../config/logger');
const bookingService = require('../services/bookingService');

async function run() {
  const due = await Booking.find({ status: 'PENDING', expiresAt: { $lt: new Date() } }).select('_id').lean();
  for (const b of due) {
    try {
      await bookingService.expire(b._id);
    } catch (err) {
      logger.warn({ err, bookingId: b._id }, 'Booking expiry skipped');
    }
  }
  if (due.length) logger.info(`Expired ${due.length} pending booking(s)`);
}

exports.run = run;
exports.start = () => cron.schedule('*/10 * * * *', () => run().catch((err) => logger.error({ err }, 'Expiry job failed')));
