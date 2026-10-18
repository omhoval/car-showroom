const { z, objectId, opt, money, date, listQuery } = require('./common');

const method = z.enum(['CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'CHEQUE', 'FINANCE', 'ONLINE']);

exports.create = z
  .object({
    bookingId: objectId,
    amount: money,
    paymentMethod: method,
    transactionId: opt(z.string().trim().min(3).max(100)),
    paymentDate: opt(date),
    remarks: opt(z.string().trim().max(500)),
  })
  .refine((b) => b.paymentMethod === 'CASH' || b.transactionId, {
    message: 'Transaction ID is required for non-cash payments',
    path: ['transactionId'],
  });

exports.verify = z.object({ decision: z.enum(['SUCCESS', 'FAILED']), remarks: opt(z.string().trim().max(500)) });
exports.refund = z.object({ amount: money, remarks: opt(z.string().trim().max(500)) });
exports.list = listQuery;
