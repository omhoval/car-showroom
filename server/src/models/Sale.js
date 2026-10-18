const { Schema, model } = require('mongoose');
const { BOOKING_PAYMENT_STATUS, DELIVERY_STATUS } = require('../constants/statuses');
const { baseOptions } = require('./plugins');

const saleSchema = new Schema(
  {
    invoiceNumber: { type: String, required: true },
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    carId: { type: Schema.Types.ObjectId, ref: 'Car', required: true },
    salesExecutiveId: { type: Schema.Types.ObjectId, ref: 'User' },
    salePrice: { type: Number, required: true, min: 0.01 },
    discount: { type: Number, default: 0, min: 0 },
    taxRatePercent: { type: Number, required: true, min: 0 },
    tax: { type: Number, required: true, min: 0 },
    finalAmount: { type: Number, required: true, min: 0 },
    paymentStatus: { type: String, enum: Object.values(BOOKING_PAYMENT_STATUS), default: BOOKING_PAYMENT_STATUS.UNPAID },
    deliveryStatus: { type: String, enum: Object.values(DELIVERY_STATUS), default: DELIVERY_STATUS.PENDING },
    deliveredAt: Date,
    deliveryNotes: { type: String, trim: true, maxlength: 500 },
    saleDate: { type: Date, default: Date.now },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  baseOptions
);

saleSchema.index({ invoiceNumber: 1 }, { unique: true });
saleSchema.index({ bookingId: 1 }, { unique: true });
saleSchema.index({ carId: 1 }, { unique: true });
saleSchema.index({ saleDate: -1 });
saleSchema.index({ salesExecutiveId: 1, saleDate: -1 });
saleSchema.index({ customerId: 1, saleDate: -1 });

module.exports = model('Sale', saleSchema);
