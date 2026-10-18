const AuditLog = require('../models/AuditLog');
const logger = require('../config/logger');
const { paginatedList, dateRange } = require('../utils/query');

exports.log = async ({ actor, action, entityType, entityId, changes, ip }) => {
  try {
    await AuditLog.create({
      actorId: actor?.id || null,
      actorRole: actor?.role,
      action,
      entityType,
      entityId,
      changes,
      ip,
    });
  } catch (err) {
    logger.error({ err, action }, 'Audit log failed');
  }
};

exports.list = (query, user) =>
  paginatedList({
    Model: AuditLog, query, user, resource: 'auditLogs', softDelete: false,
    filters: {
      action: query.action, entityType: query.entityType, actorId: query.actorId,
      createdAt: dateRange(query.from, query.to),
    },
    searchFields: ['action', 'entityType'],
    sortFields: ['createdAt', 'action'],
    populate: { path: 'actorId', select: 'name role' },
  });
