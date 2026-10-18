const { Schema, model } = require('mongoose');
const { PAYMENT_STATUS, PAYMENT_KIND, PAYMENT_METHOD } = require('../constants/statuses');
const { baseOptions } = require('./plugins');

const paymentSchema = new Schema(
  {
    receiptNumber: { type: String, required: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
    kind: { type: String, enum: Object.values(PAYMENT_KIND), default: PAYMENT_KIND.PAYMENT },
    amount: { type: Number, required: true, min: 0.01 },
    paymentMethod: { type: String, enum: Object.values(PAYMENT_METHOD), required: true },
    transactionId: { type: String, trim: true },
    paymentDate: {
      type: Date,
      default: Date.now,
      validate: [(v) => v.getTime() <= Date.now() + 60000, 'Payment date cannot be in the future'],
    },
    status: { type: String, enum: Object.values(PAYMENT_STATUS), required: true },
    refundOfPaymentId: { type: Schema.Types.ObjectId, ref: 'Payment' },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    remarks: { type: String, trim: true, maxlength: 500 },
  },
  baseOptions
);

paymentSchema.index({ bookingId: 1, createdAt: 1 });
paymentSchema.index({ customerId: 1, createdAt: -1 });
paymentSchema.index({ transactionId: 1 }, { unique: true, sparse: true });
paymentSchema.index({ receiptNumber: 1 }, { unique: true });

module.exports = model('Payment', paymentSchema);
