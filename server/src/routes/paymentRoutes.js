const router = require('express').Router();
const c = require('../controllers/paymentController');
const v = require('../validators/paymentValidator');
const { idParam } = require('../validators/common');
const { validate } = require('../middleware/validationMiddleware');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(authenticate);
router.get('/', authorize('payments:read'), validate({ query: v.list }), c.list);
router.post('/', authorize('payments:create'), validate({ body: v.create }), c.create);
router.patch('/:id/verify', authorize('payments:verify'), validate({ params: idParam, body: v.verify }), c.verify);
router.post('/:id/refund', authorize('payments:refund'), validate({ params: idParam, body: v.refund }), c.refund);

module.exports = router;
