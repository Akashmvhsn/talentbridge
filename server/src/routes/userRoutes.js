const router = require('express').Router();
const { updateMe, myStats } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.put('/me', updateMe);
router.get('/me/stats', myStats);

module.exports = router;
