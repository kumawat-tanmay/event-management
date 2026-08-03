const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  createSiteReceipt,
  createSiteVerification,
  submitReturnAndSettle,
  getExecutionsByBooking,
  getExecutions,
} = require('../controllers/eventExecutionController');
const { protect } = require('../middlewares/authMiddleware');
const requirePermission = require('../middlewares/requirePermission');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max file size
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images are allowed'));
  }
});

router.use(protect);

// Routes
router.get('/', requirePermission('operations.view'), getExecutions);
router.get('/booking/:bookingId', requirePermission('operations.view'), getExecutionsByBooking);
router.post('/site-receipt', requirePermission('operations.create'), upload.array('photos', 10), createSiteReceipt);
router.post('/site-verification', requirePermission('operations.create'), upload.array('photos', 10), createSiteVerification);
router.post('/return-settle', requirePermission('operations.update'), upload.array('photos', 10), submitReturnAndSettle);

module.exports = router;
