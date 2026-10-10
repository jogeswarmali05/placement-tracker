const router = require('express').Router();
const c = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/analytics', c.getAnalytics); // keep above '/:id'
router.route('/').get(c.getReports).post(c.createReport);
router.route('/:id').put(c.updateReport).delete(c.deleteReport);

module.exports = router;
