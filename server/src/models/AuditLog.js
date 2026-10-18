const { Schema, model } = require('mongoose');

const schema = new Schema(
  {
    actorId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    actorRole: String,
    action: { type: String, required: true },
    entityType: String,
    entityId: Schema.Types.ObjectId,
    changes: Schema.Types.Mixed,
    ip: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);
schema.index({ entityType: 1, entityId: 1, createdAt: -1 });
schema.index({ actorId: 1, createdAt: -1 });

module.exports = model('AuditLog', schema);
