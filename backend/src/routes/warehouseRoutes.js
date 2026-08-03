const express = require('express');
const router = express.Router();
const {
  getWarehouses,
  getWarehouseById,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
  bulkImportWarehouseLayout
} = require('../controllers/warehouseController');
const { protect } = require('../middlewares/authMiddleware');
const requirePermission = require('../middlewares/requirePermission');
const validate = require('../middlewares/validate');
const { createWarehouseSchema, updateWarehouseSchema } = require('../validators/warehouseValidator');

// Base route: /api/warehouses
// All routes are protected
router.use(protect);

router.get('/', requirePermission('warehouses.view'), getWarehouses);
router.get('/:id', requirePermission('warehouses.view'), getWarehouseById);
router.post('/', requirePermission('warehouses.create'), validate(createWarehouseSchema), createWarehouse);
router.post('/:id/bulk-import-layout', requirePermission('warehouses.update'), bulkImportWarehouseLayout);
router.put('/:id', requirePermission('warehouses.update'), validate(updateWarehouseSchema), updateWarehouse);
router.delete('/:id', requirePermission('warehouses.delete'), deleteWarehouse);

module.exports = router;
