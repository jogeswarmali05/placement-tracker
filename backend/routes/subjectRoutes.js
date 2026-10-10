const router = require('express').Router();
const c = require('../controllers/subjectController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.route('/').get(c.getSubjects).post(c.createSubject);
router.route('/:id').put(c.updateSubject).delete(c.deleteSubject);

module.exports = router;
