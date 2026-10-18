const bcrypt = require('bcrypt');
const env = require('../config/env');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const ApiError = require('../utils/ApiError');
const { STAFF_ROLES, ROLES } = require('../constants/roles');
const { paginatedList, inList } = require('../utils/query');
const audit = require('./auditService');

exports.list = (query, user) => {
  const roles = user.role === ROLES.ADMIN ? undefined : STAFF_ROLES;
  return paginatedList({
    Model: User, query, user, resource: 'users', softDelete: false,
    base: { role: roles ? { $in: roles } : { $ne: ROLES.CUSTOMER } },
    filters: {
      role: query.role ? inList(query.role) : undefined,
      isActive: query.isActive === undefined ? undefined : query.isActive === 'true',
    },
    searchFields: ['name', 'email', 'phone'],
    sortFields: ['name', 'createdAt', 'role'],
  });
};

exports.create = async (body, actor, ip) => {
  const dup = await User.findOne({ $or: [{ email: body.email }, { phone: body.phone }] }).select('_id');
  if (dup) throw new ApiError('DUPLICATE_RESOURCE', 'A user with this email or phone already exists');
  const { password, ...rest } = body;
  const created = await User.create({ ...rest, passwordHash: await bcrypt.hash(password, env.BCRYPT_ROUNDS) });
  await audit.log({ actor, action: 'USER_CREATED', entityType: 'USER', entityId: created._id, changes: { role: { to: created.role } }, ip });
  return created;
};

exports.update = async (id, body, actor, ip) => {
  const target = await User.findById(id);
  if (!target || target.role === ROLES.CUSTOMER) throw new ApiError('NOT_FOUND', 'User not found');
  if (String(target._id) === actor.id && (body.isActive === false || (body.role && body.role !== target.role))) {
    throw new ApiError('FORBIDDEN', 'You cannot change your own role or deactivate yourself');
  }
  const changes = {};
  if (body.role && body.role !== target.role) changes.role = { from: target.role, to: body.role };
  if (body.isActive !== undefined && body.isActive !== target.isActive) changes.isActive = { from: target.isActive, to: body.isActive };

  const { password, ...rest } = body;
  Object.assign(target, rest);
  if (password) target.passwordHash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);
  await target.save();
  if (body.isActive === false || password) {
    await RefreshToken.updateMany({ userId: target._id, revokedAt: null }, { revokedAt: new Date() });
  }
  if (changes.role) await audit.log({ actor, action: 'USER_ROLE_CHANGED', entityType: 'USER', entityId: target._id, changes, ip });
  if (changes.isActive?.to === false) await audit.log({ actor, action: 'USER_DEACTIVATED', entityType: 'USER', entityId: target._id, ip });
  return target;
};
