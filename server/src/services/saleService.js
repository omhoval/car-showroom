const Sale = require('../models/Sale');
const Booking = require('../models/Booking');
const Car = require('../models/Car');
const User = require('../models/User');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const { ROLES } = require('../constants/roles');
const { toPaise, sub, add, percentOf } = require('../utils/money');
const { withTransaction } = require('../utils/transaction');
const { paginatedList, loadOrThrow, inList, dateRange } = require('../utils/query');
const counters = require('./counterService');
const audit = require('./auditService');
const notifications = require('./notificationService');
const leadService = require('./leadService');
const { recalculate } = require('./paymentService');

const populate = [
  { path: 'customerId', select: 'name phone email address city state' },
  { path: 'carId', select: 'brand model variant color vin' },
  { path: 'salesExecutiveId', select: 'name' },
  { path: 'bookingId', select: 'bookingNumber paidAmount' },
];

exports.list = (query, user) =>
  paginatedList({
    Model: Sale, query, user, resource: 'sales', softDelete: false,
    filters: {
      paymentStatus: query.paymentStatus ? inList(query.paymentStatus) : undefined,
      deliveryStatus: query.deliveryStatus ? inList(query.deliveryStatus) : undefined,
      customerId: user.role === ROLES.CUSTOMER ? undefined : query.customerId,
      salesExecutiveId: query.salesExecutiveId,
      saleDate: dateRange(query.from, query.to),
    },
    searchFields: ['invoiceNumber'],
    sortFields: ['saleDate', 'finalAmount', 'createdAt'],
    defaultSort: '-saleDate',
    populate,
  });

exports.get = (id, user) => loadOrThrow(Sale, id, { user, resource: 'sales', softDelete: false, populate, name: 'Sale' });

exports.create = async (body, user, ip) => {
  if (body.salePrice && user.role === ROLES.SALES_EXECUTIVE) throw new ApiError('FORBIDDEN', 'Only managers can change the sale price');

  const sale = await withTransaction(async (session) => {
    const booking = await loadOrThrow(Booking, body.bookingId, { user, resource: 'bookings', softDelete: false, session, name: 'Booking' });
    if (booking.saleId) throw new ApiError('SALE_ALREADY_EXISTS');
    if (booking.status !== 'CONFIRMED') throw new ApiError('BOOKING_NOT_ACTIVE');

    const salePrice = body.salePrice || booking.totalPrice;
    const discount = body.discount || 0;
    if (toPaise(discount) > toPaise(salePrice)) throw new ApiError('VALIDATION_ERROR', 'Discount cannot exceed sale price', [{ field: 'discount', message: 'Too high' }]);
    const taxable = sub(salePrice, discount);
    const tax = percentOf(taxable, env.TAX_RATE_PERCENT);
    const finalAmount = add(taxable, tax);
    if (toPaise(finalAmount) < toPaise(booking.paidAmount)) throw new ApiError('SALE_AMOUNT_LESS_THAN_PAID');

    const [created] = await Sale.create(
      [{
        invoiceNumber: await counters.next('INV', session),
        bookingId: booking._id, customerId: booking.customerId, carId: booking.carId,
        salesExecutiveId: booking.salesExecutiveId || user.id,
        salePrice, discount, taxRatePercent: env.TAX_RATE_PERCENT, tax, finalAmount, createdBy: user.id,
      }],
      { session }
    );

    const car = await Car.findOneAndUpdate(
      { _id: booking.carId, status: 'RESERVED', reservedByBookingId: booking._id },
      { $set: { status: 'SOLD', soldSaleId: created._id }, $unset: { reservedByBookingId: 1 } },
      { session }
    );
    if (!car) throw new ApiError('INVALID_STATE_TRANSITION', 'Car is not reserved for this booking');

    const updated = await Booking.findOneAndUpdate(
      { _id: booking._id, status: 'CONFIRMED' },
      { $set: { status: 'COMPLETED', payableAmount: finalAmount, saleId: created._id }, $unset: { expiresAt: 1 } },
      { session }
    );
    if (!updated) throw new ApiError('BOOKING_NOT_ACTIVE');

    await recalculate(booking._id, session);
    await leadService.systemTransition(booking.leadId, 'CONVERTED', { saleId: created._id }, session);
    return Sale.findById(created._id).session(session);
  });

  const customerUser = await User.findOne({ customerId: sale.customerId }).select('_id').lean();
  await notifications.notify([sale.salesExecutiveId, customerUser?._id], {
    type: 'SALE_COMPLETED', title: 'Sale completed', message: sale.invoiceNumber, entityType: 'SALE', entityId: sale._id,
  });
  await audit.log({ actor: user, action: 'SALE_CREATED', entityType: 'SALE', entityId: sale._id, ip });
  return sale;
};

exports.deliver = async (id, { deliveryNotes }, user, ip) => {
  const sale = await Sale.findOneAndUpdate(
    { _id: id, deliveryStatus: 'PENDING', paymentStatus: 'PAID' },
    { deliveryStatus: 'DELIVERED', deliveredAt: new Date(), deliveryNotes },
    { new: true }
  );
  if (!sale) {
    const existing = await Sale.findById(id);
    if (!existing) throw new ApiError('NOT_FOUND', 'Sale not found');
    if (existing.deliveryStatus === 'DELIVERED') throw new ApiError('INVALID_STATE_TRANSITION', 'Sale is already delivered');
    throw new ApiError('DELIVERY_NOT_ALLOWED');
  }
  const customerUser = await User.findOne({ customerId: sale.customerId }).select('_id').lean();
  await notifications.notify([customerUser?._id, sale.salesExecutiveId], {
    type: 'DELIVERY_COMPLETED', title: 'Vehicle delivered', message: sale.invoiceNumber, entityType: 'SALE', entityId: sale._id,
  });
  await audit.log({ actor: user, action: 'DELIVERY_COMPLETED', entityType: 'SALE', entityId: sale._id, ip });
  return sale;
};
