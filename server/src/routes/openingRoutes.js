const router = require('express').Router();
const c = require('../controllers/openingController');
const multer = require('multer');
const { protect } = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.use(protect);

router.get('/', c.list);
router.get('/mine', c.mine); // keep above '/:id'
router.post('/', c.create);
router.post('/parse-jd', upload.single('file'), c.parseJd);

router.get('/:id', c.getOne);
router.put('/:id', c.update);
router.delete('/:id', c.remove);

router.post('/:id/signal', c.signal);
router.post('/:id/reveal-phone', c.revealPhone);
router.post('/:id/placements', c.confirmPlacement);

module.exports = router;
