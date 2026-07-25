const express = require('express');
const router = express.Router();
const { getUsers, inviteUser } = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');
const requirePermission = require('../middlewares/requirePermission');

// Base route: /api/users
router.get('/', protect, requirePermission('users.view'), getUsers);
router.post('/invite', protect, requirePermission('users.create'), inviteUser);

module.exports = router;
