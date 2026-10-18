const { Schema, model } = require('mongoose');
const { ROLE_LIST } = require('../constants/roles');
const { baseOptions } = require('./plugins');

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true, match: /^[6-9]\d{9}$/ },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLE_LIST, required: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer' },
    department: { type: String, trim: true, maxlength: 60 },
    joiningDate: Date,
    isActive: { type: Boolean, default: true },
    lastLoginAt: Date,
  },
  baseOptions
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ phone: 1 }, { unique: true, sparse: true });
userSchema.index({ role: 1, isActive: 1 });
userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  },
});

module.exports = model('User', userSchema);
