const { z, opt, listQuery } = require('./common');

const year = new Date().getFullYear();
const image = z.object({ url: z.string().url(), isPrimary: z.boolean().optional() });

const base = {
  brand: z.string().trim().min(1).max(60),
  model: z.string().trim().min(1).max(60),
  variant: z.string().trim().min(1).max(60),
  manufacturingYear: z.coerce.number().int().min(1990).max(year + 1),
  fuelType: z.enum(['PETROL', 'DIESEL', 'CNG', 'ELECTRIC', 'HYBRID']),
  transmission: z.enum(['MANUAL', 'AUTOMATIC']),
  color: z.string().trim().min(1).max(40),
  price: z.coerce.number().positive(),
  registrationNumber: opt(z.string().trim().max(20)),
  vin: z.string().trim().toUpperCase().regex(/^[A-HJ-NPR-Z0-9]{17}$/, 'VIN must be 17 characters (no I, O, Q)'),
  engineNumber: opt(z.string().trim().max(40)),
  mileage: z.coerce.number().min(0).optional(),
  images: z.array(image).max(10).optional(),
  description: opt(z.string().trim().max(2000)),
};

exports.create = z.object(base);
exports.update = z.object(base).partial();
exports.status = z.object({ status: z.enum(['AVAILABLE', 'IN_SERVICE']) });
exports.list = listQuery;
