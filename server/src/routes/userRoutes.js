const router = require('express').Router();
const c = require('../controllers/userController');
const v = require('../validators/userValidator');
const { idParam } = require('../validators/common');
const { validate } = require('../middleware/validationMiddleware');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(authenticate);
router.get('/', authorize('users:read'), validate({ query: v.list }), c.list);
router.post('/', authorize('users:manage'), validate({ body: v.create }), c.create);
router.put('/:id', authorize('users:manage'), validate({ params: idParam, body: v.update }), c.update);

module.exports = router;
