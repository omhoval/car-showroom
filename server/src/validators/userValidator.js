const { z, phone, password, opt, date, listQuery } = require('./common');

const staffRole = z.enum(['ADMIN', 'MANAGER', 'SALES_EXECUTIVE']);

exports.create = z
  .object({
    name: z.string().trim().min(2).max(100),
    email: z.string().trim().toLowerCase().email(),
    phone,
    password,
    role: staffRole,
    department: opt(z.string().trim().max(60)),
    joiningDate: opt(date),
  })
  .strict();

exports.update = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    phone: phone.optional(),
    password: password.optional(),
    role: staffRole.optional(),
    department: opt(z.string().trim().max(60)),
    joiningDate: opt(date),
    isActive: z.boolean().optional(),
  })
  .strict();

exports.list = listQuery;
