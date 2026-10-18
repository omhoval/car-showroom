const { Schema, model } = require('mongoose');
const env = require('../config/env');
const { TEST_DRIVE_STATUS } = require('../constants/statuses');
const { softDeleteFields, baseOptions } = require('./plugins');

const testDriveSchema = new Schema(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    carId: { type: Schema.Types.ObjectId, ref: 'Car', required: true },
    salesExecutiveId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead' },
    scheduledAt: { type: Date, required: true },
    durationMinutes: { type: Number, default: env.TEST_DRIVE_DURATION_MIN, min: 15, max: 240 },
    endsAt: Date,
    status: { type: String, enum: Object.values(TEST_DRIVE_STATUS), default: TEST_DRIVE_STATUS.SCHEDULED },
    remarks: { type: String, trim: true, maxlength: 1000 },
    cancelReason: {
      type: String,
      trim: true,
      required: function () {
        return this.status === TEST_DRIVE_STATUS.CANCELLED;
      },
    },
    ...softDeleteFields,
  },
  baseOptions
);

testDriveSchema.pre('validate', function (next) {
  if (this.scheduledAt && this.durationMinutes) {
    this.endsAt = new Date(this.scheduledAt.getTime() + this.durationMinutes * 60000);
  }
  next();
});

testDriveSchema.index({ carId: 1, scheduledAt: 1 });
testDriveSchema.index({ salesExecutiveId: 1, scheduledAt: 1 });
testDriveSchema.index({ customerId: 1, scheduledAt: -1 });
testDriveSchema.index({ status: 1, scheduledAt: 1 });

module.exports = model('TestDrive', testDriveSchema);
