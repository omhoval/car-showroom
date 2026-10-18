const { Schema, model } = require('mongoose');
const { CAR_STATUS, FUEL_TYPE, TRANSMISSION } = require('../constants/statuses');
const { softDeleteFields, baseOptions } = require('./plugins');

const carSchema = new Schema(
  {
    brand: { type: String, required: true, trim: true, maxlength: 60 },
    model: { type: String, required: true, trim: true, maxlength: 60 },
    variant: { type: String, required: true, trim: true, maxlength: 60 },
    manufacturingYear: {
      type: Number,
      required: true,
      min: 1990,
      max: new Date().getFullYear() + 1,
      validate: Number.isInteger,
    },
    fuelType: { type: String, enum: Object.values(FUEL_TYPE), required: true },
    transmission: { type: String, enum: Object.values(TRANSMISSION), required: true },
    color: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 1 },
    registrationNumber: { type: String, uppercase: true, trim: true },
    vin: { type: String, required: true, uppercase: true, trim: true, match: /^[A-HJ-NPR-Z0-9]{17}$/ },
    engineNumber: { type: String, trim: true },
    mileage: { type: Number, min: 0, default: 0 },
    images: {
      type: [{ _id: false, url: { type: String, required: true }, isPrimary: { type: Boolean, default: false } }],
      validate: [(v) => v.length <= 10 && v.filter((i) => i.isPrimary).length <= 1, 'Max 10 images and one primary'],
    },
    description: { type: String, trim: true, maxlength: 2000 },
    status: { type: String, enum: Object.values(CAR_STATUS), default: CAR_STATUS.AVAILABLE },
    reservedByBookingId: { type: Schema.Types.ObjectId, ref: 'Booking' },
    soldSaleId: { type: Schema.Types.ObjectId, ref: 'Sale' },
    ...softDeleteFields,
  },
  baseOptions
);

carSchema.index({ vin: 1 }, { unique: true });
carSchema.index({ registrationNumber: 1 }, { unique: true, sparse: true });
carSchema.index({ engineNumber: 1 }, { unique: true, sparse: true });
carSchema.index({ isDeleted: 1, status: 1, brand: 1, price: 1 });
carSchema.index({ isDeleted: 1, createdAt: -1 });

module.exports = model('Car', carSchema);
