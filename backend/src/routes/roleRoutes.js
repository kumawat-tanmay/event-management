const express = require('express');
const router = express.Router();
const { getRoles, createRole, updateRole, deleteRole } = require('../controllers/roleController');
const { protect } = require('../middlewares/authMiddleware');
const requirePermission = require('../middlewares/requirePermission');
const { PERMISSIONS } = require('../config/permissions');
const validate = require('../middlewares/validate');
const { createRoleSchema, updateRoleSchema } = require('../validators/roleValidator');

// All routes are protected
router.use(protect);

router.route('/')
  .get(requirePermission(PERMISSIONS.ROLES_VIEW), getRoles)
  .post(requirePermission(PERMISSIONS.ROLES_CREATE), validate(createRoleSchema), createRole);

router.route('/:id')
  .put(requirePermission(PERMISSIONS.ROLES_UPDATE), validate(updateRoleSchema), updateRole)
  .delete(requirePermission(PERMISSIONS.ROLES_DELETE), deleteRole);

module.exports = router;
