const router = require('express').Router();
const { updateProfile, changePassword } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.put('/profile', updateProfile);
router.put('/password', changePassword);

module.exports = router;
