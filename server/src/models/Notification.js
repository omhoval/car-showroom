const { Schema, model } = require('mongoose');
const { NOTIFICATION_TYPE } = require('../constants/statuses');

const schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: Object.values(NOTIFICATION_TYPE), required: true },
    title: { type: String, required: true, maxlength: 100 },
    message: { type: String, maxlength: 300 },
    entityType: String,
    entityId: Schema.Types.ObjectId,
    isRead: { type: Boolean, default: false },
    readAt: Date,
  },
  { timestamps: true }
);
schema.index({ userId: 1, isRead: 1, createdAt: -1 });
schema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

module.exports = model('Notification', schema);
