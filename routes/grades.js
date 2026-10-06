const router = require('express').Router();
const controller = require('../controllers/grades');
const { authenticate, isAdmin } = require('../middleware/auth');

router.use(authenticate);
// Check write permissions before resolving :id or accessing any grade.
router.use((req, res, next) => {
  if (['POST', 'PUT', 'DELETE'].includes(req.method)) return isAdmin(req, res, next);
  next();
});
router.param('id', controller.findGrade);
router.get('/', controller.list);
router.get('/:id', controller.get);
router.post('/', controller.create);
router.put('/:id', controller.replace);
router.delete('/:id', controller.remove);

module.exports = router;
