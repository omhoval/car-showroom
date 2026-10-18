const { Schema, model } = require('mongoose');
const { BOOKING_STATUS, BOOKING_PAYMENT_STATUS } = require('../constants/statuses');
const { baseOptions } = require('./plugins');

const bookingSchema = new Schema(
  {
    bookingNumber: { type: String, required: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    carId: { type: Schema.Types.ObjectId, ref: 'Car', required: true },
    salesExecutiveId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead' },
    bookingAmount: { type: Number, required: true, min: 0.01 },
    totalPrice: { type: Number, required: true, min: 0.01 },
    payableAmount: { type: Number, required: true, min: 0.01 },
    paidAmount: { type: Number, default: 0, min: 0 },
    paymentStatus: { type: String, enum: Object.values(BOOKING_PAYMENT_STATUS), default: BOOKING_PAYMENT_STATUS.UNPAID },
    status: { type: String, enum: Object.values(BOOKING_STATUS), default: BOOKING_STATUS.PENDING },
    bookingDate: { type: Date, default: Date.now },
    expectedDeliveryDate: Date,
    expiresAt: Date,
    cancelReason: { type: String, trim: true, maxlength: 500 },
    cancelledAt: Date,
    cancelledBy: { type: Schema.Types.ObjectId, ref: 'User' },
    saleId: { type: Schema.Types.ObjectId, ref: 'Sale' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  baseOptions
);

bookingSchema.index({ bookingNumber: 1 }, { unique: true });
bookingSchema.index(
  { carId: 1 },
  { unique: true, name: 'uniq_active_booking_per_car', partialFilterExpression: { status: { $in: ['PENDING', 'CONFIRMED'] } } }
);
bookingSchema.index({ customerId: 1, createdAt: -1 });
bookingSchema.index({ salesExecutiveId: 1, status: 1 });
bookingSchema.index({ status: 1, expiresAt: 1 });

module.exports = model('Booking', bookingSchema);
