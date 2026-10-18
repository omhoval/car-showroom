const { Schema, model } = require('mongoose');
const { LEAD_STATUS, LEAD_SOURCE } = require('../constants/statuses');
const { softDeleteFields, baseOptions } = require('./plugins');

const leadSchema = new Schema(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    interestedCarId: { type: Schema.Types.ObjectId, ref: 'Car' },
    source: { type: String, enum: Object.values(LEAD_SOURCE), required: true },
    assignedEmployeeId: { type: Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: Object.values(LEAD_STATUS), default: LEAD_STATUS.NEW },
    followUpDate: {
      type: Date,
      required: function () {
        return this.status === LEAD_STATUS.FOLLOW_UP;
      },
    },
    lostReason: {
      type: String,
      trim: true,
      maxlength: 500,
      required: function () {
        return this.status === LEAD_STATUS.LOST;
      },
    },
    notes: [
      {
        text: { type: String, required: true, trim: true, maxlength: 1000 },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking' },
    saleId: { type: Schema.Types.ObjectId, ref: 'Sale' },
    ...softDeleteFields,
  },
  baseOptions
);

leadSchema.index({ assignedEmployeeId: 1, status: 1, followUpDate: 1 });
leadSchema.index({ customerId: 1 });
leadSchema.index({ isDeleted: 1, status: 1, followUpDate: 1 });

module.exports = model('Lead', leadSchema);
