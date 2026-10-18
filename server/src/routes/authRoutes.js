const router = require('express').Router();
const c = require('../controllers/authController');
const v = require('../validators/authValidator');
const { validate } = require('../middleware/validationMiddleware');
const { authenticate } = require('../middleware/authMiddleware');
// const { authRateLimiter } = require('../middleware/rateLimiters');

router.post('/register', validate({ body: v.register }), c.register);
router.post('/login', validate({ body: v.login }), c.login);
router.post('/refresh', c.refresh);
router.post('/logout', c.logout);
router.post('/forgot-password', validate({ body: v.forgot }), c.forgotPassword);
router.post('/reset-password', validate({ body: v.reset }), c.resetPassword);
router.get('/me', authenticate, c.me);

module.exports = router;
