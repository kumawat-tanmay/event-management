const express = require('express');
const router = express.Router();
const financeController = require('../controllers/financeController');
const { protect } = require('../middlewares/authMiddleware');
const requirePermission = require('../middlewares/requirePermission');

router.use(protect);

router.get('/cashbook', requirePermission('finance.view'), financeController.getCashbook);
router.get('/bankbook', requirePermission('finance.view'), financeController.getBankbook);
router.get('/profit-loss', requirePermission('finance.view'), financeController.getProfitLoss);

module.exports = router;
