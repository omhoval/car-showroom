const { z, objectId, opt, phone, listQuery } = require('./common');

const base = {
  name: z.string().trim().min(2).max(100),
  phone,
  email: opt(z.string().trim().toLowerCase().email()),
  address: opt(z.string().trim().max(300)),
  city: opt(z.string().trim().max(60)),
  state: opt(z.string().trim().max(60)),
  drivingLicense: opt(z.string().trim().max(30)),
  interestedCars: z.array(objectId).max(20).optional(),
  assignedSalesExecutive: opt(objectId),
};

exports.create = z.object(base);
exports.update = z.object(base).partial();
exports.list = listQuery;
