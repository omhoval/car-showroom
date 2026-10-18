const bcrypt = require('bcrypt');
const crypto = require('crypto');
const env = require('../config/env');
const logger = require('../config/logger');
const User = require('../models/User');
const Customer = require('../models/Customer');
const RefreshToken = require('../models/RefreshToken');
const PasswordResetToken = require('../models/PasswordResetToken');
const ApiError = require('../utils/ApiError');
const { withTransaction } = require('../utils/transaction');
const { signAccessToken, generateOpaqueToken, sha256 } = require('../utils/tokens');
const audit = require('./auditService');
const notifications = require('./notificationService');

const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', 10);
const refreshExpiry = () => new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 86400000);

async function issueRefresh(userId, meta, familyId = crypto.randomUUID(), session) {
  const raw = generateOpaqueToken();
  await RefreshToken.create(
    [{ userId, tokenHash: sha256(raw), familyId, expiresAt: refreshExpiry(), userAgent: meta.userAgent, ip: meta.ip }],
    { session }
  );
  return { raw, familyId };
}

exports.register = async ({ name, email, phone, password }, meta) => {
  const exists = await User.findOne({ $or: [{ email }, { phone }] }).select('_id');
  if (exists) throw new ApiError('DUPLICATE_RESOURCE', 'An account with this email or phone already exists');
  const passwordHash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);

  const { user, refresh } = await withTransaction(async (session) => {
    let customer = await Customer.findOne({
      isDeleted: false, userId: { $exists: false }, $or: [{ email }, { phone }],
    }).session(session);
    if (!customer) {
      [customer] = await Customer.create([{ name, phone, email }], { session });
    }
    const [created] = await User.create(
      [{ name, email, phone, passwordHash, role: 'CUSTOMER', customerId: customer._id }],
      { session }
    );
    customer.userId = created._id;
    await customer.save({ session });
    const r = await issueRefresh(created._id, meta, undefined, session);
    return { user: created, refresh: r };
  });

  await notifications.notify(await notifications.managerIds(), {
    type: 'NEW_LEAD', title: 'New customer registered', message: `${name} created an account`,
    entityType: 'CUSTOMER', entityId: user.customerId,
  });
  return { user, accessToken: signAccessToken(user), refreshToken: refresh.raw };
};

exports.login = async ({ email, password }, meta) => {
  const user = await User.findOne({ email }).select('+passwordHash');
  const ok = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);
  if (!user || !ok) {
    await audit.log({ action: 'LOGIN_FAILED', entityType: 'USER', entityId: user?._id, changes: { email }, ip: meta.ip });
    throw new ApiError('INVALID_CREDENTIALS');
  }
  if (!user.isActive) throw new ApiError('ACCOUNT_DISABLED');
  const refresh = await issueRefresh(user._id, meta);
  user.lastLoginAt = new Date();
  await user.save();
  return { user, accessToken: signAccessToken(user), refreshToken: refresh.raw };
};

exports.refresh = async (rawToken, meta) => {
  if (!rawToken) throw new ApiError('INVALID_REFRESH_TOKEN');
  const doc = await RefreshToken.findOne({ tokenHash: sha256(rawToken) });
  if (!doc || doc.expiresAt < new Date()) throw new ApiError('INVALID_REFRESH_TOKEN');
  if (doc.revokedAt) {
    await RefreshToken.updateMany({ familyId: doc.familyId, revokedAt: null }, { revokedAt: new Date() });
    throw new ApiError('INVALID_REFRESH_TOKEN');
  }
  const user = await User.findById(doc.userId);
  if (!user || !user.isActive) {
    await RefreshToken.updateMany({ familyId: doc.familyId, revokedAt: null }, { revokedAt: new Date() });
    throw new ApiError('INVALID_REFRESH_TOKEN');
  }
  const claimed = await RefreshToken.findOneAndUpdate({ _id: doc._id, revokedAt: null }, { revokedAt: new Date() });
  if (!claimed) throw new ApiError('INVALID_REFRESH_TOKEN');
  const next = await issueRefresh(user._id, meta, doc.familyId);
  await RefreshToken.updateOne({ _id: doc._id }, { replacedByHash: sha256(next.raw) });
  return { user, accessToken: signAccessToken(user), refreshToken: next.raw };
};

exports.logout = async (rawToken) => {
  if (rawToken) await RefreshToken.updateOne({ tokenHash: sha256(rawToken), revokedAt: null }, { revokedAt: new Date() });
};

exports.forgotPassword = async ({ email }) => {
  const user = await User.findOne({ email, isActive: true });
  if (!user) return;
  await PasswordResetToken.deleteMany({ userId: user._id });
  const raw = generateOpaqueToken(32);
  await PasswordResetToken.create({
    userId: user._id, tokenHash: sha256(raw), expiresAt: new Date(Date.now() + env.PASSWORD_RESET_TTL_MIN * 60000),
  });
  logger.info(`Password reset link for ${email}: ${env.CLIENT_URL}/reset-password?token=${raw}`);
};

exports.resetPassword = async ({ token, password }) => {
  const doc = await PasswordResetToken.findOne({ tokenHash: sha256(token), usedAt: null, expiresAt: { $gt: new Date() } });
  if (!doc) throw new ApiError('INVALID_RESET_TOKEN');
  const passwordHash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);
  await withTransaction(async (session) => {
    await User.updateOne({ _id: doc.userId }, { passwordHash }, { session });
    await PasswordResetToken.updateOne({ _id: doc._id }, { usedAt: new Date() }, { session });
    await RefreshToken.updateMany({ userId: doc.userId, revokedAt: null }, { revokedAt: new Date() }, { session });
  });
};

exports.me = (userId) => User.findById(userId);
