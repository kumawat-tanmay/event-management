const express = require('express');
const router = express.Router();
const { getUsers, inviteUser, getUserById, updateUser, deleteUser } = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');
const requirePermission = require('../middlewares/requirePermission');

// Base route: /api/users
router.get('/', protect, requirePermission('users.view'), getUsers);
router.post('/invite', protect, requirePermission('users.create'), inviteUser);

router.route('/:id')
  .get(protect, requirePermission('users.view'), getUserById)
  .put(protect, requirePermission('users.update'), updateUser)
  .delete(protect, requirePermission('users.update'), deleteUser);

module.exports = router;
