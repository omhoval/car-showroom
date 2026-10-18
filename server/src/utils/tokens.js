const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const env = require('../config/env');

const signAccessToken = (user) =>
  jwt.sign({ sub: String(user._id || user.id), role: user.role }, env.JWT_ACCESS_SECRET, {
    algorithm: 'HS256',
    expiresIn: env.JWT_ACCESS_EXPIRES,
  });

const generateOpaqueToken = (bytes = 48) => crypto.randomBytes(bytes).toString('hex');
const sha256 = (v) => crypto.createHash('sha256').update(String(v)).digest('hex');

module.exports = { signAccessToken, generateOpaqueToken, sha256 };
