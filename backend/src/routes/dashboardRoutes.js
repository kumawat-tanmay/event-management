const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/rbacMiddleware');

router.use(protect);

router.get('/stats', authorize('Owner', 'Admin', 'Manager', 'Accountant'), dashboardController.getDashboardStats);

module.exports = router;
