const { z, objectId, opt, money, listQuery } = require('./common');

exports.create = z.object({
  bookingId: objectId,
  salePrice: money.optional(),
  discount: z.coerce.number().min(0).optional(),
});
exports.deliver = z.object({ deliveryNotes: opt(z.string().trim().max(500)) });
exports.list = listQuery;
