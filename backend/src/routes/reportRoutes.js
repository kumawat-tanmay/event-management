const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { protect } = require('../middlewares/authMiddleware');
const requirePermission = require('../middlewares/requirePermission');

router.use(protect);

router.get('/:reportType', requirePermission('reports.view'), reportController.getReport);

module.exports = router;
