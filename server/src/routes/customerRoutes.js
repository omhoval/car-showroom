const router = require('express').Router();
const c = require('../controllers/customerController');
const v = require('../validators/customerValidator');
const { idParam } = require('../validators/common');
const { validate } = require('../middleware/validationMiddleware');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(authenticate);
router.get('/', authorize('customers:read'), validate({ query: v.list }), c.list);
router.get('/:id', authorize('customers:read'), validate({ params: idParam }), c.get);
router.get('/:id/history', authorize('customers:read'), validate({ params: idParam }), c.history);
router.post('/', authorize('customers:write'), validate({ body: v.create }), c.create);
router.put('/:id', authorize('customers:write'), validate({ params: idParam, body: v.update }), c.update);
router.delete('/:id', authorize('customers:delete'), validate({ params: idParam }), c.remove);

module.exports = router;
