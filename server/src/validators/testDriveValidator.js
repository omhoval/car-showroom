const { z, objectId, opt, date, listQuery } = require('./common');

exports.create = z.object({
  customerId: opt(objectId),
  carId: objectId,
  salesExecutiveId: opt(objectId),
  leadId: opt(objectId),
  scheduledAt: date,
  durationMinutes: z.coerce.number().int().min(15).max(240).optional(),
  remarks: opt(z.string().trim().max(1000)),
});

exports.update = z.object({
  scheduledAt: date.optional(),
  durationMinutes: z.coerce.number().int().min(15).max(240).optional(),
  salesExecutiveId: opt(objectId),
  status: z.enum(['COMPLETED', 'CANCELLED', 'NO_SHOW']).optional(),
  cancelReason: opt(z.string().trim().max(500)),
  remarks: opt(z.string().trim().max(1000)),
});

exports.list = listQuery;
