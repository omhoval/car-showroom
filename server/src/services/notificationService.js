const Notification = require('../models/Notification');
const User = require('../models/User');
const logger = require('../config/logger');
const ApiError = require('../utils/ApiError');
const { paginatedList } = require('../utils/query');

exports.notify = async (userIds, payload) => {
  try {
    const ids = [...new Set((Array.isArray(userIds) ? userIds : [userIds]).filter(Boolean).map(String))];
    if (!ids.length) return;
    await Notification.insertMany(ids.map((userId) => ({ userId, ...payload })));
  } catch (err) {
    logger.error({ err }, 'Notification failed');
  }
};

exports.managerIds = async () => (await User.find({ role: { $in: ['ADMIN', 'MANAGER'] }, isActive: true }).select('_id').lean()).map((u) => u._id);

exports.list = (query, user) =>
  paginatedList({
    Model: Notification, query, user, resource: 'notifications', softDelete: false,
    base: { userId: user.id },
    filters: { isRead: query.unread === 'true' ? false : undefined },
    sortFields: ['createdAt'],
  });

exports.unreadCount = (user) => Notification.countDocuments({ userId: user.id, isRead: false });

exports.markRead = async (id, user) => {
  const n = await Notification.findOneAndUpdate({ _id: id, userId: user.id }, { isRead: true, readAt: new Date() }, { new: true });
  if (!n) throw new ApiError('NOT_FOUND', 'Notification not found');
  return n;
};

exports.markAllRead = (user) =>
  Notification.updateMany({ userId: user.id, isRead: false }, { isRead: true, readAt: new Date() });
