const router = require('express').Router();
const controller = require('../controllers/grades');

router.param('id', controller.findGrade);
router.get('/', controller.list);
router.get('/:id', controller.get);
router.post('/', controller.create);
router.put('/:id', controller.replace);
router.delete('/:id', controller.remove);

module.exports = router;
