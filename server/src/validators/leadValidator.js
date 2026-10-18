const { z, objectId, opt, date, listQuery } = require('./common');

const source = z.enum(['WALK_IN', 'WEBSITE', 'PHONE', 'REFERRAL', 'SOCIAL_MEDIA', 'ADVERTISEMENT', 'OTHER']);

exports.create = z.object({
  customerId: opt(objectId),
  interestedCarId: opt(objectId),
  source: source.optional(),
  assignedEmployeeId: opt(objectId),
  note: opt(z.string().trim().max(1000)),
});

exports.update = z.object({
  interestedCarId: opt(objectId),
  source: source.optional(),
  status: z.enum(['CONTACTED', 'FOLLOW_UP', 'NEGOTIATION', 'LOST']).optional(),
  followUpDate: opt(date),
  lostReason: opt(z.string().trim().max(500)),
});

exports.assign = z.object({ assignedEmployeeId: objectId });
exports.note = z.object({ text: z.string().trim().min(1).max(1000) });
exports.list = listQuery;
