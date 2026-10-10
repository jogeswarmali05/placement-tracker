const router = require('express').Router();
const c = require('../controllers/groupController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.route('/').get(c.getGroups).post(c.createGroup);
router.route('/:id').put(c.updateGroup).delete(c.deleteGroup);

module.exports = router;
