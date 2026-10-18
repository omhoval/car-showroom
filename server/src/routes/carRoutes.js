const router = require('express').Router();
const c = require('../controllers/carController');
const v = require('../validators/carValidator');
const { idParam } = require('../validators/common');
const { validate } = require('../middleware/validationMiddleware');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(authenticate);
router.get('/', authorize('cars:read'), validate({ query: v.list }), c.list);
router.get('/:id', authorize('cars:read'), validate({ params: idParam }), c.get);
router.post('/', authorize('cars:write'), validate({ body: v.create }), c.create);
router.put('/:id', authorize('cars:write'), validate({ params: idParam, body: v.update }), c.update);
router.patch('/:id/status', authorize('cars:status'), validate({ params: idParam, body: v.status }), c.changeStatus);
router.delete('/:id', authorize('cars:delete'), validate({ params: idParam }), c.remove);

module.exports = router;
