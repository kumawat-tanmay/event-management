const express = require('express');
const router = express.Router();
const {

  // Items
  getItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  // Opening Stock
  addOpeningStock,
  adjustStock,
  // Ledger
  getLedger
} = require('../controllers/inventoryController');
const { protect } = require('../middlewares/authMiddleware');
const requirePermission = require('../middlewares/requirePermission');
const validate = require('../middlewares/validate');
const { createItemSchema, updateItemSchema } = require('../validators/inventoryValidator');

// Base route: /api/inventory
// All routes are protected
router.use(protect);


// Items
router.get('/items', requirePermission('inventory.view'), getItems);
router.post('/items', requirePermission('inventory.create'), validate(createItemSchema), createItem);
router.get('/items/:id', requirePermission('inventory.view'), getItemById);
router.put('/items/:id', requirePermission('inventory.update'), validate(updateItemSchema), updateItem);
router.delete('/items/:id', requirePermission('inventory.delete'), deleteItem);

// Opening Stock & Adjustments
router.post('/items/:id/opening-stock', requirePermission('inventory.create'), addOpeningStock);
router.post('/items/:id/adjust-stock', requirePermission('inventory.update'), adjustStock);

// Ledger
router.get('/ledger', requirePermission('inventory.view'), getLedger);

module.exports = router;
