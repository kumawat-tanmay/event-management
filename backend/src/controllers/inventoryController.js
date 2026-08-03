const Item = require('../models/Item');
const InventoryLedger = require('../models/InventoryLedger');
const Warehouse = require('../models/Warehouse');
const StockLock = require('../models/StockLock');

// ─── Item Master Controllers ──────────────────────────────────────────────────

// @desc    Get all items
// @route   GET /api/inventory/items
// @access  Private (inventory.view)
const getItems = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { isDeleted: false };

    if (req.query.status) {
      filter.isActive = req.query.status === 'Active';
    }

    if (req.query.lowStock === 'true') {
      filter.$expr = { $lte: ['$totalStock', '$minStockAlert'] };
      filter.minStockAlert = { $gt: 0 };
    }

    if (req.query.search) {
      const escapedSearch = req.query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(escapedSearch, 'i');
      filter.$or = [
        { name: searchRegex },
        { code: searchRegex }
      ];
    }

    const aggregationResult = await Item.aggregate([
      { $match: filter },
      { $sort: { createdAt: -1 } },
      { $facet: {
          metadata: [ { $count: "total" } ],
          data: [ { $skip: skip }, { $limit: limit } ]
      } }
    ]);

    const total = aggregationResult[0].metadata[0]?.total || 0;
    let items = aggregationResult[0].data;

    items = await Item.populate(items, [
      { path: 'createdBy', select: 'name email' }
    ]);

    res.json({
      success: true,
      data: items,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get single item details
// @route   GET /api/inventory/items/:id
// @access  Private (inventory.view)
const getItemById = async (req, res) => {
  try {
    const item = await Item.findOne({ _id: req.params.id, isDeleted: false })
      .populate('warehouseStock.warehouse', 'name code')
      .populate('createdBy', 'name email')
      .lean();

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    res.json({ success: true, data: item });
  } catch (error) {
    console.error('Error fetching item details:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Create an item
// @route   POST /api/inventory/items
// @access  Private (inventory.create)
const createItem = async (req, res) => {
  try {
    const { name, code, description, unit, totalStock, purchaseCost, minStockAlert, isActive, image } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Item name is required' });
    }

    

    // Auto-generate code if empty
    let finalCode = code;
    if (!finalCode || !finalCode.trim()) {
      const prefix = 'ITM';
      const count = await Item.countDocuments();
      finalCode = `${prefix}-${String(count + 1).padStart(3, '0')}`;
    } else {
      finalCode = finalCode.trim().toUpperCase();
    }

    const itemExists = await Item.findOne({ code: finalCode, isDeleted: false }).lean();
    if (itemExists) {
      return res.status(400).json({ success: false, message: 'Item code / SKU already exists' });
    }

    const item = await Item.create({
      name: name.trim(),
      code: finalCode,
      description: description || '',
      unit: unit || 'Pieces',
      totalStock: totalStock ? Number(totalStock) : 0,
      availableStock: totalStock ? Number(totalStock) : 0,
      purchaseCost: purchaseCost ? Number(purchaseCost) : 0,
      minStockAlert: minStockAlert ? Number(minStockAlert) : 0,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      image: image || '',
      createdBy: req.user._id
    });

    
    res.status(201).json({ success: true, data: item, message: 'Item created successfully' });
  } catch (error) {
    console.error('Error creating item:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Item SKU code already exists' });
    }
    res.status(500).json({ success: false, message: error.message || 'Server Error' });
  }
};

// @desc    Update an item
// @route   PUT /api/inventory/items/:id
// @access  Private (inventory.update)
const updateItem = async (req, res) => {
  try {
    const { name, code, description, unit, totalStock, purchaseCost, minStockAlert, isActive, image } = req.body;

    const item = await Item.findOne({ _id: req.params.id, isDeleted: false });
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    if (code && code.trim().toUpperCase() !== item.code) {
      const codeExists = await Item.findOne({ code: code.trim().toUpperCase(), isDeleted: false }).lean();
      if (codeExists) {
        return res.status(400).json({ success: false, message: 'SKU code already exists' });
      }
      item.code = code.trim().toUpperCase();
    }

    

    if (name) item.name = name.trim();
    if (description !== undefined) item.description = description;
    if (unit !== undefined) item.unit = unit;
    if (totalStock !== undefined) {
      item.totalStock = Number(totalStock);
      item.availableStock = Number(totalStock);
    }
    if (purchaseCost !== undefined) item.purchaseCost = Number(purchaseCost);
    if (minStockAlert !== undefined) item.minStockAlert = Number(minStockAlert);
    if (isActive !== undefined) item.isActive = Boolean(isActive);
    if (image !== undefined) item.image = image;

    await item.save();

    res.json({ success: true, data: item, message: 'Item updated successfully' });
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Delete an item (soft delete)
// @route   DELETE /api/inventory/items/:id
// @access  Private (inventory.delete)
const deleteItem = async (req, res) => {
  try {
    const item = await Item.findOne({ _id: req.params.id, isDeleted: false });
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    // Block delete if there is stock > 0
    if (item.totalStock > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete item with positive stock. Adjust stock to 0 first.' 
      });
    }

    // Block delete if there are active stock locks for upcoming events
    const activeLock = await StockLock.findOne({ itemId: item._id, isReleased: false, isDeleted: false }).lean();
    if (activeLock) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete item currently locked for active reservations or bookings.'
      });
    }

    item.isDeleted = true;
    await item.save();

    
    res.json({ success: true, message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ─── Opening Stock Controllers ───────────────────────────────────────────────

// @desc    Add opening stock for an item in a specific warehouse
// @route   POST /api/inventory/items/:id/opening-stock
// @access  Private (inventory.create)
const addOpeningStock = async (req, res) => {
  try {
    const { warehouseId, quantity, zoneId, rackId } = req.body;

    if (!warehouseId || quantity === undefined || quantity < 0) {
      return res.status(400).json({ success: false, message: 'Valid warehouseId and non-negative quantity required' });
    }

    const item = await Item.findOne({ _id: req.params.id, isDeleted: false });
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    const warehouse = await Warehouse.findOne({ _id: warehouseId, isDeleted: false }).lean();
    if (!warehouse) {
      return res.status(404).json({ success: false, message: 'Warehouse not found' });
    }

    // Check if opening stock already exists to prevent duplicate entries
    const existingLedgerQuery = {
      item: item._id,
      warehouse: warehouseId,
      type: 'OPENING_STOCK'
    };
    if (zoneId) existingLedgerQuery.zoneId = zoneId;
    if (rackId) existingLedgerQuery.rackId = rackId;

    const existingLedger = await InventoryLedger.findOne(existingLedgerQuery).lean();

    if (existingLedger) {
      return res.status(400).json({ 
        success: false, 
        message: 'Opening stock already exists for this item in the selected warehouse. Use adjusting stock in the ledger instead.' 
      });
    }

    // Find current warehouse stock index
    let warehouseStockIndex = item.warehouseStock.findIndex((entry) => {
      const matchWarehouse = String(entry.warehouse) === String(warehouseId);
      const matchZone = entry.zoneId === zoneId || (!entry.zoneId && !zoneId);
      const matchRack = entry.rackId === rackId || (!entry.rackId && !rackId);
      return matchWarehouse && matchZone && matchRack;
    });

    const qtyNumber = Number(quantity);
    let balanceBefore = 0;

    if (warehouseStockIndex > -1) {
      balanceBefore = item.warehouseStock[warehouseStockIndex].quantity;
      item.warehouseStock[warehouseStockIndex].quantity = qtyNumber;
    } else {
      item.warehouseStock.push({
        warehouse: warehouseId,
        zoneId: zoneId || undefined,
        rackId: rackId || undefined,
        quantity: qtyNumber,
        dispatched: 0,
        damaged: 0
      });
    }

    // Recalculate totals
    item.totalStock = item.warehouseStock.reduce((acc, entry) => acc + entry.quantity, 0);
    // Simple recalculation: available stock = quantity - dispatched - damaged
    item.availableStock = item.warehouseStock.reduce(
      (acc, entry) => acc + (entry.quantity - (entry.dispatched || 0) - (entry.damaged || 0)), 
      0
    );

    await item.save();

    const deltaQty = Math.abs(qtyNumber - balanceBefore);

    // Create Ledger movement
    await InventoryLedger.create({
      item: item._id,
      warehouse: warehouseId,
      zoneId: zoneId || undefined,
      rackId: rackId || undefined,
      type: 'OPENING_STOCK',
      quantity: deltaQty,
      balanceBefore,
      balanceAfter: qtyNumber,
      remarks: 'Initial opening stock setup',
      performedBy: req.user._id
    });

    const populatedItem = await Item.findById(item._id)
      .populate('warehouseStock.warehouse', 'name code')
      .lean();

    res.json({ 
      success: true, 
      data: populatedItem, 
      message: 'Opening stock added successfully and ledger entry recorded' 
    });
  } catch (error) {
    console.error('Error adding opening stock:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Adjust stock for an item in a specific warehouse location
// @route   POST /api/inventory/items/:id/adjust-stock
// @access  Private (inventory.update)
const adjustStock = async (req, res) => {
  try {
    const { warehouseId, quantity, zoneId, rackId, notes } = req.body;

    if (!warehouseId || quantity === undefined || quantity < 0) {
      return res.status(400).json({ success: false, message: 'Valid warehouseId and non-negative quantity required' });
    }

    const item = await Item.findOne({ _id: req.params.id, isDeleted: false });
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    const warehouse = await Warehouse.findOne({ _id: warehouseId, isDeleted: false }).lean();
    if (!warehouse) {
      return res.status(404).json({ success: false, message: 'Warehouse not found' });
    }

    // Find current warehouse stock index
    let warehouseStockIndex = item.warehouseStock.findIndex((entry) => {
      const matchWarehouse = String(entry.warehouse) === String(warehouseId);
      const matchZone = entry.zoneId === zoneId || (!entry.zoneId && !zoneId);
      const matchRack = entry.rackId === rackId || (!entry.rackId && !rackId);
      return matchWarehouse && matchZone && matchRack;
    });

    const newQty = Number(quantity);
    let balanceBefore = 0;

    if (warehouseStockIndex > -1) {
      balanceBefore = item.warehouseStock[warehouseStockIndex].quantity;
      item.warehouseStock[warehouseStockIndex].quantity = newQty;
    } else {
      item.warehouseStock.push({
        warehouse: warehouseId,
        zoneId: zoneId || undefined,
        rackId: rackId || undefined,
        quantity: newQty,
        dispatched: 0,
        damaged: 0
      });
    }

    // Recalculate totals
    item.totalStock = item.warehouseStock.reduce((acc, entry) => acc + entry.quantity, 0);
    item.availableStock = item.warehouseStock.reduce(
      (acc, entry) => acc + (entry.quantity - (entry.dispatched || 0) - (entry.damaged || 0)), 
      0
    );

    await item.save();

    const difference = newQty - balanceBefore;

    // Create Ledger movement
    await InventoryLedger.create({
      item: item._id,
      warehouse: warehouseId,
      zoneId: zoneId || undefined,
      rackId: rackId || undefined,
      type: 'ADJUSTMENT',
      quantity: Math.abs(difference),
      balanceBefore,
      balanceAfter: newQty,
      remarks: notes || `Stock adjusted by ${difference > 0 ? '+' : ''}${difference}`,
      performedBy: req.user._id
    });

    const populatedItem = await Item.findById(item._id)
      .populate('warehouseStock.warehouse', 'name code')
      .lean();

    res.json({ 
      success: true, 
      data: populatedItem, 
      message: 'Stock adjusted successfully' 
    });
  } catch (error) {
    console.error('Error adjusting stock:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ─── Inventory Ledger Controllers ─────────────────────────────────────────────

// @desc    Get inventory ledger entries
// @route   GET /api/inventory/ledger
// @access  Private (inventory.view)
const getLedger = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};

    if (req.query.item) {
      filter.item = req.query.item;
    }
    if (req.query.warehouse) {
      filter.warehouse = req.query.warehouse;
    }
    if (req.query.type) {
      filter.type = req.query.type;
    }
    if (req.query.startDate || req.query.endDate) {
      filter.createdAt = {};
      if (req.query.startDate) {
        filter.createdAt.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        filter.createdAt.$lte = new Date(req.query.endDate);
      }
    }

    const aggregationResult = await InventoryLedger.aggregate([
      { $match: filter },
      { $sort: { createdAt: -1 } },
      { $facet: {
          metadata: [ { $count: "total" } ],
          data: [ { $skip: skip }, { $limit: limit } ]
      } }
    ]);

    const total = aggregationResult[0].metadata[0]?.total || 0;
    let ledger = aggregationResult[0].data;

    ledger = await InventoryLedger.populate(ledger, [
      { path: 'item', select: 'name code unit' },
      { path: 'warehouse', select: 'name code' },
      { path: 'performedBy', select: 'name email' }
    ]);

    res.json({
      success: true,
      data: ledger,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching inventory ledger:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
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
};
