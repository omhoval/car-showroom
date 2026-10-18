const { Schema } = require('mongoose');

const softDeleteFields = {
  isDeleted: { type: Boolean, default: false },
  deletedAt: Date,
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
};

const baseOptions = {
  timestamps: true,
  toJSON: {
    transform: (_doc, ret) => {
      delete ret.__v;
      return ret;
    },
  },
};

module.exports = { softDeleteFields, baseOptions };
