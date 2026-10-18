const { z, objectId, opt, money, date, listQuery } = require('./common');

exports.create = z.object({
  customerId: opt(objectId),
  carId: objectId,
  leadId: opt(objectId),
  salesExecutiveId: opt(objectId),
  bookingAmount: money,
  totalPrice: money.optional(),
  expectedDeliveryDate: opt(date),
});

exports.update = z.object({
  status: z.literal('CANCELLED').optional(),
  cancelReason: opt(z.string().trim().min(3).max(500)),
  expectedDeliveryDate: opt(date),
  salesExecutiveId: opt(objectId),
});

exports.list = listQuery;
