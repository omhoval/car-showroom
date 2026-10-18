const Car = require('../models/Car');
const Booking = require('../models/Booking');
const TestDrive = require('../models/TestDrive');
const ApiError = require('../utils/ApiError');
const { ROLES } = require('../constants/roles');
const { CAR_TRANSITIONS, assertTransition } = require('../constants/statuses');
const { paginatedList, loadOrThrow, inList } = require('../utils/query');
const audit = require('./auditService');

const CUSTOMER_HIDE = '-vin -engineNumber -registrationNumber -createdBy -reservedByBookingId -soldSaleId -isDeleted -deletedAt';
const selectFor = (user) => (user.role === ROLES.CUSTOMER ? CUSTOMER_HIDE : undefined);

exports.list = (query, user) =>
  paginatedList({
    Model: Car, query, user, resource: 'cars',
    filters: {
      brand: query.brand ? { $regex: `^${require('../utils/escapeRegex')(query.brand)}$`, $options: 'i' } : undefined,
      model: query.model ? { $regex: `^${require('../utils/escapeRegex')(query.model)}$`, $options: 'i' } : undefined,
      fuelType: query.fuelType ? inList(query.fuelType) : undefined,
      transmission: query.transmission ? inList(query.transmission) : undefined,
      status: query.status && user.role !== ROLES.CUSTOMER ? inList(query.status) : undefined,
      manufacturingYear: query.year ? Number(query.year) : undefined,
      price: query.minPrice || query.maxPrice
        ? { ...(query.minPrice && { $gte: Number(query.minPrice) }), ...(query.maxPrice && { $lte: Number(query.maxPrice) }) }
        : undefined,
    },
    searchFields: ['brand', 'model', 'variant', 'color', 'vin'],
    sortFields: ['price', 'brand', 'model', 'manufacturingYear', 'createdAt', 'mileage', 'status'],
    select: selectFor(user),
  });

exports.get = (id, user) => loadOrThrow(Car, id, { user, resource: 'cars', select: selectFor(user), name: 'Car' });

exports.create = async (body, actor, ip) => {
  const car = await Car.create({ ...body, createdBy: actor.id });
  await audit.log({ actor, action: 'CAR_CREATED', entityType: 'CAR', entityId: car._id, ip });
  return car;
};

exports.update = async (id, body, actor, ip) => {
  const car = await loadOrThrow(Car, id, { name: 'Car' });
  let patch = body;
  if (car.status === 'SOLD') {
    if (actor.role !== ROLES.ADMIN) throw new ApiError('INVALID_STATE_TRANSITION', 'Sold cars cannot be edited');
    patch = { description: body.description, images: body.images };
  }
  Object.keys(patch).forEach((k) => patch[k] === undefined && delete patch[k]);
  car.set(patch);
  await car.save();
  await audit.log({ actor, action: 'CAR_UPDATED', entityType: 'CAR', entityId: car._id, changes: { fields: Object.keys(patch) }, ip });
  return car;
};

exports.changeStatus = async (id, status, actor, ip) => {
  const car = await loadOrThrow(Car, id, { name: 'Car' });
  assertTransition(CAR_TRANSITIONS, car.status, status, 'car');
  const updated = await Car.findOneAndUpdate({ _id: id, status: car.status }, { status }, { new: true });
  if (!updated) throw new ApiError('INVALID_STATE_TRANSITION', 'Car status changed, please retry');
  await audit.log({ actor, action: 'CAR_STATUS_CHANGED', entityType: 'CAR', entityId: id, changes: { status: { from: car.status, to: status } }, ip });
  return updated;
};

exports.remove = async (id, actor, ip) => {
  const car = await loadOrThrow(Car, id, { name: 'Car' });
  if (car.status === 'SOLD' || car.status === 'RESERVED') throw new ApiError('CAR_HAS_ACTIVE_RECORDS');
  const [bookings, drives] = await Promise.all([
    Booking.countDocuments({ carId: id, status: { $in: ['PENDING', 'CONFIRMED'] } }),
    TestDrive.countDocuments({ carId: id, status: 'SCHEDULED', isDeleted: false }),
  ]);
  if (bookings || drives) throw new ApiError('CAR_HAS_ACTIVE_RECORDS');
  car.isDeleted = true;
  car.deletedAt = new Date();
  await car.save();
  await audit.log({ actor, action: 'CAR_DELETED', entityType: 'CAR', entityId: id, ip });
};
