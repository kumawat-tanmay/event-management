const express = require('express');
const router = express.Router();
const dispatchController = require('../controllers/dispatchController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/rbacMiddleware');
const validate = require('../middlewares/validate');
const { z } = require('zod');

const dispatchSchema = {
  body: z.object({
    bookingId: z.string().min(1, 'Booking ID is required'),
    warehouseId: z.string().min(1, 'Warehouse ID is required'),
    driverName: z.string().min(1, 'Driver name is required'),
    driverPhone: z.string().min(1, 'Driver phone is required'),
    vehicleNumber: z.string().min(1, 'Vehicle number is required'),
    gatePassNumber: z.string().optional(),
    items: z.array(
      z.object({
        item: z.string().min(1, 'Item ID is required'),
        name: z.string().min(1, 'Item name is required'),
        code: z.string().optional(),
        dispatchedQty: z.number().min(1, 'Quantity must be at least 1'),
      })
    ).min(1, 'At least 1 item is required'),
  }),
};

router.use(protect);

const opsRoles = ['Owner', 'Admin', 'Store Manager', 'Manager'];

router.get('/', authorize(...opsRoles, 'Supervisor', 'Driver'), dispatchController.getDispatches);
router.get('/:id', authorize(...opsRoles, 'Supervisor', 'Driver'), dispatchController.getDispatchById);
router.post('/', authorize(...opsRoles), validate(dispatchSchema), dispatchController.createDispatch);
router.put('/:id', authorize(...opsRoles), validate(dispatchSchema), dispatchController.updateDispatch);
router.patch('/:id/status', authorize(...opsRoles, 'Supervisor', 'Driver'), dispatchController.updateDispatchStatus);
router.delete('/:id', authorize(...opsRoles), dispatchController.deleteDispatch);

module.exports = router;
