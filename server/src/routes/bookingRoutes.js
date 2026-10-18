const router = require('express').Router();
const c = require('../controllers/bookingController');
const v = require('../validators/bookingValidator');
const { idParam } = require('../validators/common');
const { validate } = require('../middleware/validationMiddleware');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(authenticate);
router.get('/', authorize('bookings:read'), validate({ query: v.list }), c.list);
router.get('/:id', authorize('bookings:read'), validate({ params: idParam }), c.get);
router.post('/', authorize('bookings:create'), validate({ body: v.create }), c.create);
router.put('/:id', authorize('bookings:write'), validate({ params: idParam, body: v.update }), c.update);

module.exports = router;
