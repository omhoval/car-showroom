const router = require('express').Router();
const c = require('../controllers/saleController');
const v = require('../validators/saleValidator');
const { idParam } = require('../validators/common');
const { validate } = require('../middleware/validationMiddleware');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(authenticate);
router.get('/', authorize('sales:read'), validate({ query: v.list }), c.list);
router.get('/:id', authorize('sales:read'), validate({ params: idParam }), c.get);
router.post('/', authorize('sales:create'), validate({ body: v.create }), c.create);
router.patch('/:id/deliver', authorize('sales:deliver'), validate({ params: idParam, body: v.deliver }), c.deliver);

module.exports = router;
