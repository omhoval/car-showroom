const { z, objectId, opt, date, listQuery } = require('./common');

const type = z.enum(['FREE_SERVICE', 'PAID_SERVICE', 'REPAIR', 'WARRANTY', 'PDI']);

exports.create = z.object({
  customerId: objectId,
  carId: objectId,
  serviceType: type,
  serviceDate: date,
  technician: opt(z.string().trim().max(100)),
  cost: z.coerce.number().min(0).optional(),
  remarks: opt(z.string().trim().max(1000)),
});

exports.update = z.object({
  serviceDate: date.optional(),
  technician: opt(z.string().trim().max(100)),
  cost: z.coerce.number().min(0).optional(),
  remarks: opt(z.string().trim().max(1000)),
  status: z.enum(['IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
});

exports.list = listQuery;
