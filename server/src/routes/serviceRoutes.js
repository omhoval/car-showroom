const router = require('express').Router();
const c = require('../controllers/serviceController');
const v = require('../validators/serviceValidator');
const { idParam } = require('../validators/common');
const { validate } = require('../middleware/validationMiddleware');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(authenticate);
router.get('/', authorize('services:read'), validate({ query: v.list }), c.list);
router.get('/:id', authorize('services:read'), validate({ params: idParam }), c.get);
router.post('/', authorize('services:write'), validate({ body: v.create }), c.create);
router.put('/:id', authorize('services:write'), validate({ params: idParam, body: v.update }), c.update);

module.exports = router;
