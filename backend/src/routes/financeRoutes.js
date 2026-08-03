const express = require('express');
const router = express.Router();
const financeController = require('../controllers/financeController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/rbacMiddleware');

router.use(protect);

const financeRoles = ['Owner', 'Admin', 'Accountant'];

router.get('/cashbook', authorize(...financeRoles), financeController.getCashbook);
router.get('/bankbook', authorize(...financeRoles), financeController.getBankbook);
router.get('/profit-loss', authorize(...financeRoles), financeController.getProfitLoss);

module.exports = router;
