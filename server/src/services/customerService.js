const Customer = require('../models/Customer');
const User = require('../models/User');
const Lead = require('../models/Lead');
const TestDrive = require('../models/TestDrive');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Sale = require('../models/Sale');
const ApiError = require('../utils/ApiError');
const { ROLES } = require('../constants/roles');
const { paginatedList, loadOrThrow, ensureExists } = require('../utils/query');

const searchFields = ['name', 'phone', 'email', 'city'];

exports.list = (query, user) =>
  paginatedList({
    Model: Customer, query, user, resource: 'customers',
    filters: { city: query.city, state: query.state, assignedSalesExecutive: query.assignedSalesExecutive },
    searchFields,
    sortFields: ['name', 'city', 'createdAt'],
    populate: { path: 'assignedSalesExecutive', select: 'name' },
  });

exports.get = (id, user) =>
  loadOrThrow(Customer, id, {
    user, resource: 'customers', name: 'Customer',
    populate: [{ path: 'assignedSalesExecutive', select: 'name' }, { path: 'interestedCars', select: 'brand model variant' }],
  });

async function validateAssignee(id) {
  if (id) await ensureExists(User, id, 'Sales executive', { role: ROLES.SALES_EXECUTIVE, isActive: true });
}

exports.create = async (body, user) => {
  if (user.role === ROLES.CUSTOMER) throw new ApiError('FORBIDDEN');
  await validateAssignee(body.assignedSalesExecutive);
  const data = { ...body, createdBy: user.id };
  if (user.role === ROLES.SALES_EXECUTIVE) data.assignedSalesExecutive = user.id;
  return Customer.create(data);
};

exports.update = async (id, body, user) => {
  const customer = await loadOrThrow(Customer, id, { user, resource: 'customers', name: 'Customer' });
  let patch = body;
  if (user.role === ROLES.CUSTOMER) {
    const { name, address, city, state, drivingLicense } = body;
    patch = { name, address, city, state, drivingLicense };
  } else if (user.role === ROLES.SALES_EXECUTIVE) {
    const { assignedSalesExecutive, ...rest } = body;
    patch = rest;
  } else {
    await validateAssignee(body.assignedSalesExecutive);
  }
  Object.keys(patch).forEach((k) => patch[k] === undefined && delete patch[k]);
  customer.set(patch);
  await customer.save();
  return customer;
};

exports.remove = async (id) => {
  const customer = await loadOrThrow(Customer, id, { name: 'Customer' });
  const active = await Booking.countDocuments({ customerId: id, status: { $in: ['PENDING', 'CONFIRMED'] } });
  if (active) throw new ApiError('INVALID_STATE_TRANSITION', 'Customer has active bookings');
  customer.isDeleted = true;
  customer.deletedAt = new Date();
  await customer.save();
};

exports.history = async (id, user) => {
  await loadOrThrow(Customer, id, { user, resource: 'customers', name: 'Customer' });
  const q = { customerId: id };
  const [leads, testDrives, bookings, payments, sales] = await Promise.all([
    Lead.find({ ...q, isDeleted: false }).sort('-createdAt').populate('interestedCarId', 'brand model variant').lean(),
    TestDrive.find({ ...q, isDeleted: false }).sort('-scheduledAt').populate('carId', 'brand model variant').lean(),
    Booking.find(q).sort('-createdAt').populate('carId', 'brand model variant').lean(),
    user.role === ROLES.SALES_EXECUTIVE ? [] : Payment.find(q).sort('-createdAt').lean(),
    Sale.find(q).sort('-saleDate').populate('carId', 'brand model variant').lean(),
  ]);
  return { leads, testDrives, bookings, payments, sales };
};
