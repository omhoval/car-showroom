const { z } = require('zod');

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');
const blank = (v) => (v === '' || v === null ? undefined : v);
const opt = (schema) => z.preprocess(blank, schema.optional());
const phone = z.string().trim().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number');
const money = z.coerce.number().positive().refine((n) => Math.round(n * 100) / 100 === n, 'Max 2 decimals');
const date = z.coerce.date();

const idParam = z.object({ id: objectId });
const listQuery = z
  .object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    sort: z.string().max(100).optional(),
    search: z.string().max(100).optional(),
  })
  .passthrough();

const password = z
  .string()
  .min(8, 'Min 8 characters')
  .regex(/[A-Z]/, 'Needs an uppercase letter')
  .regex(/[a-z]/, 'Needs a lowercase letter')
  .regex(/\d/, 'Needs a digit');

module.exports = { z, objectId, blank, opt, phone, money, date, idParam, listQuery, password };
