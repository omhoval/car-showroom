const router = require('express').Router();
const c = require('../controllers/testDriveController');
const v = require('../validators/testDriveValidator');
const { idParam } = require('../validators/common');
const { validate } = require('../middleware/validationMiddleware');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(authenticate);
router.get('/', authorize('testDrives:read'), validate({ query: v.list }), c.list);
router.get('/:id', authorize('testDrives:read'), validate({ params: idParam }), c.get);
router.post('/', authorize('testDrives:create'), validate({ body: v.create }), c.create);
router.put('/:id', authorize('testDrives:write'), validate({ params: idParam, body: v.update }), c.update);
router.delete('/:id', authorize('testDrives:delete'), validate({ params: idParam }), c.remove);

module.exports = router;
