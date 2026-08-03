const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/rbacMiddleware');

router.use(protect);

const auditRoles = ['Owner', 'Admin'];

router.get('/', authorize(...auditRoles), auditController.getAuditLogs);

module.exports = router;
