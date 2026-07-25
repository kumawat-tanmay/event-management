const express = require('express');
const router = express.Router();
const { getRoles, createRole, updateRole, deleteRole } = require('../controllers/roleController');
const { protect } = require('../middlewares/authMiddleware');
const requirePermission = require('../middlewares/requirePermission');
const { PERMISSIONS } = require('../config/permissions');

// All routes are protected
router.use(protect);

router.route('/')
  .get(requirePermission(PERMISSIONS.ROLES_VIEW), getRoles)
  .post(requirePermission(PERMISSIONS.ROLES_CREATE), createRole);

router.route('/:id')
  .put(requirePermission(PERMISSIONS.ROLES_UPDATE), updateRole)
  .delete(requirePermission(PERMISSIONS.ROLES_DELETE), deleteRole);

module.exports = router;
