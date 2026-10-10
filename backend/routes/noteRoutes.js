const router = require('express').Router();
const c = require('../controllers/noteController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.route('/').get(c.getNotes).post(c.createNote);
router.route('/:id').get(c.getNote).put(c.updateNote).delete(c.deleteNote);

module.exports = router;
