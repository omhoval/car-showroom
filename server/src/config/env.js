require('dotenv').config();
const { z } = require('zod');

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5000),
  MONGO_URI: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES: z.string().default('15m'),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().default(7),
  PASSWORD_RESET_TTL_MIN: z.coerce.number().default(30),
  BCRYPT_ROUNDS: z.coerce.number().default(12),
  CLIENT_URL: z.string().url(),
  COOKIE_SECURE: z.enum(['true', 'false']).optional(),
  TAX_RATE_PERCENT: z.coerce.number().default(28),
  BOOKING_HOLD_HOURS: z.coerce.number().default(48),
  TEST_DRIVE_DURATION_MIN: z.coerce.number().default(60),
  RATE_LIMIT_WINDOW_MIN: z.coerce.number().default(15),
  RATE_LIMIT_MAX: z.coerce.number().default(300),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().default(10),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment variables:');
  parsed.error.issues.forEach((i) => console.error(` - ${i.path.join('.')}: ${i.message}`));
  process.exit(1);
}

const env = parsed.data;
env.COOKIE_SECURE = env.COOKIE_SECURE ? env.COOKIE_SECURE === 'true' : env.NODE_ENV === 'production';
module.exports = env;
