const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const Sale = require('../models/Sale');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { ROLES } = require('../constants/roles');
const { PAYMENT_TRANSITIONS, BOOKING_TRANSITIONS, assertTransition } = require('../constants/statuses');
const { toPaise, fromPaise } = require('../utils/money');
const { withTransaction } = require('../utils/transaction');
const { paginatedList, loadOrThrow, inList, dateRange } = require('../utils/query');
const counters = require('./counterService');
const audit = require('./auditService');
const notifications = require('./notificationService');

const populate = [
  { path: 'bookingId', select: 'bookingNumber status totalPrice payableAmount paidAmount' },
  { path: 'customerId', select: 'name phone' },
];

function computePaymentStatus(booking, hasRefunds) {
  const paid = toPaise(booking.paidAmount);
  if (booking.status === 'CANCELLED') {
    if (paid > 0) return 'REFUND_DUE';
    return hasRefunds ? 'REFUNDED' : 'UNPAID';
  }
  if (paid === 0) return 'UNPAID';
  if (paid >= toPaise(booking.payableAmount)) return 'PAID';
  return 'PARTIAL';
}

async function recalculate(bookingId, session) {
  const booking = await Booking.findById(bookingId).session(session);
  const payments = await Payment.find({ bookingId }).session(session).lean();
  let paid = 0;
  let hasRefunds = false;
  for (const p of payments) {
    if (p.kind === 'PAYMENT' && ['SUCCESS', 'REFUNDED'].includes(p.status)) paid += toPaise(p.amount);
    if (p.kind === 'REFUND' && p.status === 'SUCCESS') {
      paid -= toPaise(p.amount);
      hasRefunds = true;
    }
  }
  booking.paidAmount = fromPaise(paid);
  let confirmed = false;
  if (booking.status === 'PENDING' && paid >= toPaise(booking.bookingAmount)) {
    assertTransition(BOOKING_TRANSITIONS, 'PENDING', 'CONFIRMED', 'booking');
    booking.status = 'CONFIRMED';
    booking.expiresAt = undefined;
    confirmed = true;
  }
  booking.paymentStatus = computePaymentStatus(booking, hasRefunds);
  await booking.save({ session });
  if (booking.saleId) await Sale.updateOne({ _id: booking.saleId }, { paymentStatus: booking.paymentStatus }, { session });
  return { booking, confirmed };
}

const dueOf = (b) => toPaise(b.payableAmount) - toPaise(b.paidAmount);

async function afterPayment({ payment, booking, confirmed, actor }) {
  const customerUser = await User.findOne({ customerId: booking.customerId }).select('_id').lean();
  const recipients = [booking.salesExecutiveId, customerUser?._id];
  if (payment.status === 'PENDING') {
    await notifications.notify(await notifications.managerIds(), {
      type: 'PAYMENT_PENDING_VERIFICATION', title: 'Payment awaiting verification',
      message: `${payment.receiptNumber} for ${booking.bookingNumber}`, entityType: 'PAYMENT', entityId: payment._id,
    });
  } else {
    await notifications.notify(recipients, {
      type: 'PAYMENT_RECEIVED', title: 'Payment received',
      message: `${payment.receiptNumber} for ${booking.bookingNumber}`, entityType: 'PAYMENT', entityId: payment._id,
    });
  }
  if (confirmed) {
    await notifications.notify(recipients, {
      type: 'BOOKING_CONFIRMED', title: 'Booking confirmed', message: booking.bookingNumber, entityType: 'BOOKING', entityId: booking._id,
    });
    await audit.log({ actor, action: 'BOOKING_CONFIRMED', entityType: 'BOOKING', entityId: booking._id });
  }
}

exports.computePaymentStatus = computePaymentStatus;
exports.recalculate = recalculate;

exports.list = (query, user) =>
  paginatedList({
    Model: Payment, query, user, resource: 'payments', softDelete: false,
    filters: {
      bookingId: query.bookingId,
      customerId: user.role === ROLES.CUSTOMER ? undefined : query.customerId,
      status: query.status ? inList(query.status) : undefined,
      kind: query.kind ? inList(query.kind) : undefined,
      paymentMethod: query.paymentMethod ? inList(query.paymentMethod) : undefined,
      paymentDate: dateRange(query.from, query.to),
    },
    searchFields: ['receiptNumber', 'transactionId'],
    sortFields: ['createdAt', 'amount', 'paymentDate', 'status'],
    populate,
  });

exports.record = async (body, user, ip) => {
  const isCustomer = user.role === ROLES.CUSTOMER;
  const result = await withTransaction(async (session) => {
    const booking = await loadOrThrow(Booking, body.bookingId, { user, resource: 'bookings', softDelete: false, session, name: 'Booking' });
    if (booking.status === 'CANCELLED') throw new ApiError('PAYMENT_NOT_ALLOWED');
    if (toPaise(body.amount) > dueOf(booking)) throw new ApiError('PAYMENT_EXCEEDS_DUE');

    const [payment] = await Payment.create(
      [{
        receiptNumber: await counters.next('RCP', session),
        customerId: booking.customerId,
        bookingId: booking._id,
        kind: 'PAYMENT',
        amount: body.amount,
        paymentMethod: body.paymentMethod,
        transactionId: body.transactionId,
        paymentDate: body.paymentDate,
        status: isCustomer ? 'PENDING' : 'SUCCESS',
        recordedBy: user.id,
        remarks: body.remarks,
      }],
      { session }
    );
    const recalculated = isCustomer ? { booking, confirmed: false } : await recalculate(booking._id, session);
    return { payment, ...recalculated };
  });
  await afterPayment({ ...result, actor: user });
  await audit.log({ actor: user, action: 'PAYMENT_RECORDED', entityType: 'PAYMENT', entityId: result.payment._id, changes: { amount: { to: body.amount } }, ip });
  return result.payment;
};

exports.verify = async (id, { decision, remarks }, user, ip) => {
  const result = await withTransaction(async (session) => {
    const payment = await Payment.findOne({ _id: id, kind: 'PAYMENT' }).session(session);
    if (!payment) throw new ApiError('NOT_FOUND', 'Payment not found');
    assertTransition(PAYMENT_TRANSITIONS, payment.status, decision, 'payment');
    const booking = await Booking.findById(payment.bookingId).session(session);
    if (decision === 'SUCCESS') {
      if (booking.status === 'CANCELLED') throw new ApiError('PAYMENT_NOT_ALLOWED');
      if (toPaise(payment.amount) > dueOf(booking)) throw new ApiError('PAYMENT_EXCEEDS_DUE');
    }
    payment.status = decision;
    if (remarks) payment.remarks = remarks;
    await payment.save({ session });
    return { payment, ...(await recalculate(booking._id, session)) };
  });
  if (decision === 'SUCCESS') await afterPayment({ ...result, actor: user });
  await audit.log({ actor: user, action: 'PAYMENT_VERIFIED', entityType: 'PAYMENT', entityId: id, changes: { status: { to: decision } }, ip });
  return result.payment;
};

exports.refund = async (id, { amount, remarks }, user, ip) => {
  const refund = await withTransaction(async (session) => {
    const payment = await Payment.findOne({ _id: id, kind: 'PAYMENT', status: 'SUCCESS' }).session(session);
    if (!payment) throw new ApiError('NOT_FOUND', 'Refundable payment not found');
    const refunds = await Payment.find({ refundOfPaymentId: payment._id, status: 'SUCCESS' }).session(session).lean();
    const refunded = refunds.reduce((s, r) => s + toPaise(r.amount), 0);
    const refundable = toPaise(payment.amount) - refunded;
    if (toPaise(amount) > refundable) throw new ApiError('PAYMENT_EXCEEDS_DUE', 'Refund exceeds the refundable amount');

    const [doc] = await Payment.create(
      [{
        receiptNumber: await counters.next('RCP', session),
        customerId: payment.customerId,
        bookingId: payment.bookingId,
        kind: 'REFUND',
        amount,
        paymentMethod: payment.paymentMethod,
        status: 'SUCCESS',
        refundOfPaymentId: payment._id,
        recordedBy: user.id,
        remarks,
      }],
      { session }
    );
    if (toPaise(amount) === refundable) {
      assertTransition(PAYMENT_TRANSITIONS, payment.status, 'REFUNDED', 'payment');
      payment.status = 'REFUNDED';
      await payment.save({ session });
    }
    await recalculate(payment.bookingId, session);
    return doc;
  });
  await audit.log({ actor: user, action: 'PAYMENT_REFUNDED', entityType: 'PAYMENT', entityId: id, changes: { amount: { to: amount } }, ip });
  return refund;
};
