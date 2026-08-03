const express = require('express');
const router = express.Router();
const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

const { getCompanySettings, updateCompanySettings } = require('../controllers/settingsController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/company', protect, getCompanySettings);
router.put('/company', protect, upload.single('logo'), updateCompanySettings);

module.exports = router;
