const Booking = require('../models/Booking');
const Car = require('../models/Car');
const Customer = require('../models/Customer');
const Lead = require('../models/Lead');
const User = require('../models/User');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const { ROLES } = require('../constants/roles');
const { toPaise } = require('../utils/money');
const { withTransaction } = require('../utils/transaction');
const { paginatedList, loadOrThrow, ensureExists, inList, dateRange } = require('../utils/query');
const counters = require('./counterService');
const audit = require('./auditService');
const notifications = require('./notificationService');
const leadService = require('./leadService');
const { computePaymentStatus } = require('./paymentService');

const populate = [
  { path: 'customerId', select: 'name phone' },
  { path: 'carId', select: 'brand model variant color' },
  { path: 'salesExecutiveId', select: 'name' },
];

exports.list = (query, user) =>
  paginatedList({
    Model: Booking, query, user, resource: 'bookings', softDelete: false,
    filters: {
      status: query.status ? inList(query.status) : undefined,
      paymentStatus: query.paymentStatus ? inList(query.paymentStatus) : undefined,
      carId: query.carId,
      customerId: user.role === ROLES.CUSTOMER ? undefined : query.customerId,
      salesExecutiveId: query.salesExecutiveId,
      bookingDate: dateRange(query.from, query.to),
    },
    searchFields: ['bookingNumber'],
    sortFields: ['createdAt', 'bookingDate', 'totalPrice', 'status'],
    populate,
  });

exports.get = (id, user) => loadOrThrow(Booking, id, { user, resource: 'bookings', softDelete: false, populate, name: 'Booking' });

async function reserveCar(carId, session) {
  const car = await Car.findOneAndUpdate({ _id: carId, status: 'AVAILABLE', isDeleted: false }, { status: 'RESERVED' }, { new: true, session });
  if (car) return car;
  const existing = await Car.findOne({ _id: carId, isDeleted: false }).session(session);
  if (!existing) throw new ApiError('NOT_FOUND', 'Car not found');
  if (existing.status === 'RESERVED') throw new ApiError('CAR_ALREADY_RESERVED');
  if (existing.status === 'SOLD') throw new ApiError('CAR_ALREADY_SOLD');
  throw new ApiError('CAR_NOT_AVAILABLE');
}

exports.create = async (body, user, ip) => {
  let booking;
  try {
    booking = await withTransaction(async (session) => {
      const customerId = user.role === ROLES.CUSTOMER ? user.customerId : body.customerId;
      if (!customerId) throw new ApiError('VALIDATION_ERROR', 'customerId is required', [{ field: 'customerId', message: 'Required' }]);
      const customer = await ensureExists(Customer, customerId, 'Customer', {}, session);
      const car = await reserveCar(body.carId, session);
      const lead = body.leadId ? await ensureExists(Lead, body.leadId, 'Lead', { customerId }, session) : null;

      const isStaff = user.role !== ROLES.CUSTOMER;
      const totalPrice = isStaff && body.totalPrice ? body.totalPrice : car.price;
      if (toPaise(body.bookingAmount) <= 0 || toPaise(body.bookingAmount) > toPaise(totalPrice)) throw new ApiError('BOOKING_AMOUNT_INVALID');

      let salesExecutiveId = null;
      if (user.role === ROLES.SALES_EXECUTIVE) salesExecutiveId = user.id;
      else if (isStaff && body.salesExecutiveId) {
        await ensureExists(User, body.salesExecutiveId, 'Sales executive', { role: ROLES.SALES_EXECUTIVE, isActive: true }, session);
        salesExecutiveId = body.salesExecutiveId;
      } else salesExecutiveId = lead?.assignedEmployeeId || customer.assignedSalesExecutive || null;

      const [created] = await Booking.create(
        [{
          bookingNumber: await counters.next('BK', session),
          customerId, carId: car._id, salesExecutiveId, leadId: lead?._id,
          bookingAmount: body.bookingAmount, totalPrice, payableAmount: totalPrice,
          expectedDeliveryDate: body.expectedDeliveryDate,
          expiresAt: new Date(Date.now() + env.BOOKING_HOLD_HOURS * 3600000),
          createdBy: user.id,
        }],
        { session }
      );
      await Car.updateOne({ _id: car._id }, { reservedByBookingId: created._id }, { session });
      await leadService.systemTransition(lead?._id, 'BOOKING', { bookingId: created._id }, session);
      return created;
    });
  } catch (err) {
    if (err.code === 11000 && err.keyPattern?.carId) throw new ApiError('CAR_ALREADY_RESERVED');
    throw err;
  }

  const recipients = booking.salesExecutiveId ? [booking.salesExecutiveId] : await notifications.managerIds();
  await notifications.notify(recipients, {
    type: 'BOOKING_CREATED', title: 'New booking', message: booking.bookingNumber, entityType: 'BOOKING', entityId: booking._id,
  });
  await audit.log({ actor: user, action: 'BOOKING_CREATED', entityType: 'BOOKING', entityId: booking._id, ip });
  return booking;
};

async function cancelCore(bookingId, { reason, cancelledBy }) {
  return withTransaction(async (session) => {
    const set = { status: 'CANCELLED', cancelReason: reason, cancelledAt: new Date() };
    if (cancelledBy) set.cancelledBy = cancelledBy;
    const booking = await Booking.findOneAndUpdate(
      { _id: bookingId, status: { $in: ['PENDING', 'CONFIRMED'] } },
      { $set: set, $unset: { expiresAt: 1 } },
      { new: true, session }
    );
    if (!booking) throw new ApiError('BOOKING_NOT_ACTIVE');
    await Car.findOneAndUpdate(
      { _id: booking.carId, status: 'RESERVED', reservedByBookingId: booking._id },
      { $set: { status: 'AVAILABLE' }, $unset: { reservedByBookingId: 1 } },
      { session }
    );
    await leadService.systemTransition(booking.leadId, 'NEGOTIATION', { bookingId: undefined }, session);
    booking.paymentStatus = computePaymentStatus(booking, false);
    await booking.save({ session });
    return booking;
  });
}

exports.update = async (id, body, user, ip) => {
  const booking = await loadOrThrow(Booking, id, { user, resource: 'bookings', softDelete: false, name: 'Booking' });
  const isCustomer = user.role === ROLES.CUSTOMER;

  if (body.status === 'CANCELLED') {
    if (!body.cancelReason) throw new ApiError('VALIDATION_ERROR', 'cancelReason is required', [{ field: 'cancelReason', message: 'Required' }]);
    const cancelled = await cancelCore(id, { reason: body.cancelReason, cancelledBy: user.id });
    await notifications.notify([booking.salesExecutiveId], {
      type: 'BOOKING_CANCELLED', title: 'Booking cancelled', message: booking.bookingNumber, entityType: 'BOOKING', entityId: booking._id,
    });
    await audit.log({ actor: user, action: 'BOOKING_CANCELLED', entityType: 'BOOKING', entityId: id, changes: { reason: { to: body.cancelReason } }, ip });
    return cancelled;
  }

  if (isCustomer) throw new ApiError('FORBIDDEN', 'You can only cancel your booking');
  if (!['PENDING', 'CONFIRMED'].includes(booking.status)) throw new ApiError('BOOKING_NOT_ACTIVE');
  if (body.expectedDeliveryDate) {
    if (body.expectedDeliveryDate < booking.bookingDate) throw new ApiError('VALIDATION_ERROR', 'Delivery date cannot be before booking date');
    booking.expectedDeliveryDate = body.expectedDeliveryDate;
  }
  if (body.salesExecutiveId) {
    if (user.role === ROLES.SALES_EXECUTIVE) throw new ApiError('FORBIDDEN');
    await ensureExists(User, body.salesExecutiveId, 'Sales executive', { role: ROLES.SALES_EXECUTIVE, isActive: true });
    booking.salesExecutiveId = body.salesExecutiveId;
  }
  await booking.save();
  return booking;
};

exports.expire = async (bookingId) => {
  const booking = await cancelCore(bookingId, { reason: 'Booking hold expired' });
  await notifications.notify([booking.salesExecutiveId], {
    type: 'BOOKING_EXPIRED', title: 'Booking expired', message: booking.bookingNumber, entityType: 'BOOKING', entityId: booking._id,
  });
  await audit.log({ action: 'BOOKING_EXPIRED', entityType: 'BOOKING', entityId: booking._id });
};
