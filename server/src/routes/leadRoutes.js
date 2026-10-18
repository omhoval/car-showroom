const router = require('express').Router();
const c = require('../controllers/leadController');
const v = require('../validators/leadValidator');
const { idParam } = require('../validators/common');
const { validate } = require('../middleware/validationMiddleware');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(authenticate);
router.get('/', authorize('leads:read'), validate({ query: v.list }), c.list);
router.get('/:id', authorize('leads:read'), validate({ params: idParam }), c.get);
router.post('/', authorize('leads:create'), validate({ body: v.create }), c.create);
router.put('/:id', authorize('leads:write'), validate({ params: idParam, body: v.update }), c.update);
router.patch('/:id/assign', authorize('leads:assign'), validate({ params: idParam, body: v.assign }), c.assign);
router.post('/:id/notes', authorize('leads:write'), validate({ params: idParam, body: v.note }), c.addNote);
router.delete('/:id', authorize('leads:delete'), validate({ params: idParam }), c.remove);

module.exports = router;
