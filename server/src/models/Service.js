const { Schema, model } = require('mongoose');
const { SERVICE_STATUS, SERVICE_TYPE } = require('../constants/statuses');
const { baseOptions } = require('./plugins');

const serviceSchema = new Schema(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    carId: { type: Schema.Types.ObjectId, ref: 'Car', required: true },
    serviceType: { type: String, enum: Object.values(SERVICE_TYPE), required: true },
    serviceDate: { type: Date, required: true },
    technician: { type: String, trim: true, maxlength: 100 },
    cost: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: Object.values(SERVICE_STATUS), default: SERVICE_STATUS.SCHEDULED },
    remarks: { type: String, trim: true, maxlength: 1000 },
    completedAt: Date,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  baseOptions
);

serviceSchema.index({ carId: 1, serviceDate: -1 });
serviceSchema.index({ customerId: 1, serviceDate: -1 });
serviceSchema.index({ status: 1, serviceDate: 1 });

module.exports = model('Service', serviceSchema);
