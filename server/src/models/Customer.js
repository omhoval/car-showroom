const { Schema, model } = require('mongoose');
const { softDeleteFields, baseOptions } = require('./plugins');

const customerSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    phone: { type: String, required: true, trim: true, match: /^[6-9]\d{9}$/ },
    email: { type: String, lowercase: true, trim: true },
    address: { type: String, trim: true, maxlength: 300 },
    city: { type: String, trim: true, maxlength: 60 },
    state: { type: String, trim: true, maxlength: 60 },
    drivingLicense: { type: String, uppercase: true, trim: true, maxlength: 30 },
    interestedCars: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Car' }],
      validate: [(v) => v.length <= 20, 'Max 20 interested cars'],
    },
    assignedSalesExecutive: { type: Schema.Types.ObjectId, ref: 'User' },
    ...softDeleteFields,
  },
  baseOptions
);

customerSchema.index({ phone: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });
customerSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { isDeleted: false, email: { $type: 'string' } } });
customerSchema.index({ userId: 1 }, { unique: true, sparse: true });
customerSchema.index({ assignedSalesExecutive: 1, isDeleted: 1 });

module.exports = model('Customer', customerSchema);
