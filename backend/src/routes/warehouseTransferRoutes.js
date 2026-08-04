const express = require('express');
const router = express.Router();
const warehouseTransferController = require('../controllers/warehouseTransferController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/rbacMiddleware');
const validate = require('../middlewares/validate');
const { z } = require('zod');

const transferSchema = {
  body: z.object({
    fromWarehouse: z.string().min(1, 'Source Warehouse is required'),
    toWarehouse: z.string().min(1, 'Destination Warehouse is required'),
    remarks: z.string().optional(),
    items: z.array(
      z.object({
        item: z.string().min(1, 'Item ID is required'),
        name: z.string().min(1, 'Item name is required'),
        code: z.string().optional(),
        quantity: z.number().min(1, 'Quantity must be at least 1'),
      })
    ).min(1, 'At least 1 item is required'),
  }),
};

router.use(protect);

const opsRoles = ['Owner', 'Admin', 'Manager'];

router.get('/', authorize(...opsRoles, 'Manager'), warehouseTransferController.getTransfers);
router.get('/:id', authorize(...opsRoles, 'Manager'), warehouseTransferController.getTransferById);
router.post('/', authorize(...opsRoles), validate(transferSchema), warehouseTransferController.createTransfer);
router.put('/:id', authorize(...opsRoles), validate(transferSchema), warehouseTransferController.updateTransfer);
router.post('/:id/approve', authorize(...opsRoles), warehouseTransferController.approveAndDispatchTransfer);
router.post('/:id/receive', authorize(...opsRoles), warehouseTransferController.receiveTransfer);
router.post('/:id/cancel', authorize(...opsRoles), warehouseTransferController.cancelTransfer);
router.delete('/:id', authorize(...opsRoles), warehouseTransferController.deleteTransfer);

module.exports = router;
