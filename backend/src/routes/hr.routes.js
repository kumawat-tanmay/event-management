const express = require('express');
const router = express.Router();
const hrController = require('../controllers/hrController');
const { protect } = require('../middlewares/authMiddleware');
const requirePermission = require('../middlewares/requirePermission');
const validate = require('../middlewares/validate');
const {
  createStaffSchema,
  updateStaffSchema,
  logPaymentSchema,
  createVehicleSchema,
  updateVehicleSchema
} = require('../validators/hrValidator');

// Protect all HR routes
router.use(protect);

// Staff Routes
router.get('/staff', requirePermission('hr.view'), hrController.getStaff);
router.get('/staff/:id', requirePermission('hr.view'), hrController.getStaffById);
router.post('/staff', requirePermission('hr.create'), validate(createStaffSchema), hrController.createStaff);
router.put('/staff/:id', requirePermission('hr.update'), validate(updateStaffSchema), hrController.updateStaff);
router.delete('/staff/:id', requirePermission('hr.delete'), hrController.deleteStaff);
router.post('/staff/:id/pay', requirePermission('hr.update'), validate(logPaymentSchema), hrController.logStaffPayment);

// Vehicle Routes
router.get('/vehicles', requirePermission('hr.view'), hrController.getVehicles);
router.get('/vehicles/:id', requirePermission('hr.view'), hrController.getVehicleById);
router.post('/vehicles', requirePermission('hr.create'), validate(createVehicleSchema), hrController.createVehicle);
router.put('/vehicles/:id', requirePermission('hr.update'), validate(updateVehicleSchema), hrController.updateVehicle);
router.delete('/vehicles/:id', requirePermission('hr.delete'), hrController.deleteVehicle);

module.exports = router;
