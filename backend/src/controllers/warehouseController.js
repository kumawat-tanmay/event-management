const Warehouse = require('../models/Warehouse');
const Item = require('../models/Item');

// @desc    Get all active warehouses
// @route   GET /api/warehouses
// @access  Private (warehouses.view)
const getWarehouses = async (req, res) => {
  try {
    const warehouses = await Warehouse.find({ isDeleted: false })
      .populate('managerId', 'name email phone avatar')
      .populate('incharge', 'name email phone avatar')
      .populate('createdBy', 'name email')
      .sort({ isDefault: -1, createdAt: 1 })
      .lean();
    const warehouseTotals = await Item.aggregate([
      { $match: { isDeleted: false } },
      { $unwind: "$warehouseStock" },
      { $group: { _id: "$warehouseStock.warehouse", totalQty: { $sum: "$warehouseStock.quantity" } } }
    ]);

    const countMap = {};
    warehouseTotals.forEach(wt => {
      if (wt._id) countMap[wt._id.toString()] = wt.totalQty;
    });

    const dataWithCounts = warehouses.map((wh) => ({
      ...wh,
      totalZones: wh.zones?.length || 0,
      totalRacks: wh.zones?.reduce((acc, z) => acc + (z.racks?.length || 0), 0) || 0,
      currentItemsCount: countMap[wh._id.toString()] || 0,
    }));

    res.json({ success: true, data: dataWithCounts });
  } catch (error) {
    console.error('Error fetching warehouses:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get single warehouse by ID
// @route   GET /api/warehouses/:id
// @access  Private (warehouses.view)
const getWarehouseById = async (req, res) => {
  try {
    const warehouse = await Warehouse.findOne({ _id: req.params.id, isDeleted: false })
      .populate('managerId', 'name email phone avatar')
      .populate('incharge', 'name email phone avatar')
      .populate('createdBy', 'name email')
      .lean();
      
    if (!warehouse) {
      return res.status(404).json({ success: false, message: 'Warehouse not found' });
    }
    
    res.json({ success: true, data: warehouse });
  } catch (error) {
    console.error('Error fetching warehouse:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Create a new warehouse
// @route   POST /api/warehouses
// @access  Private (warehouses.create)
const createWarehouse = async (req, res) => {
  try {
    const { name, code, location, address, phone, managerId, incharge, isDefault, isActive, zones } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Warehouse name is required' });
    }

    const warehouseExists = await Warehouse.findOne({ 
      name: name.trim(), 
      isDeleted: false 
    }).collation({ locale: 'en', strength: 2 }).lean();

    if (warehouseExists) {
      return res.status(400).json({ success: false, message: 'Warehouse with this name already exists' });
    }

    // Auto-generate code if missing to prevent { code: null } E11000 duplicate key error
    const finalCode = code && code.trim() 
      ? code.trim().toUpperCase() 
      : 'WH-' + Math.floor(1000 + Math.random() * 9000);

    // If marked as primary default, unset default on other godowns
    if (isDefault) {
      await Warehouse.updateMany({}, { isDefault: false });
    }

    const warehouse = await Warehouse.create({
      name: name.trim(),
      code: finalCode,
      location: location || address || '',
      address: address || location || '',
      phone: phone || '',
      managerId: managerId || incharge || req.user._id,
      incharge: incharge || managerId || req.user._id,
      isDefault: Boolean(isDefault),
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      zones: zones || [],
      createdBy: req.user._id
    });

    const populatedWarehouse = await Warehouse.findById(warehouse._id)
      .populate('managerId', 'name email phone avatar')
      .populate('incharge', 'name email phone avatar')
      .populate('createdBy', 'name email')
      .lean();

    res.status(201).json({ success: true, data: populatedWarehouse, message: 'Warehouse created successfully' });
  } catch (error) {
    console.error('Error creating warehouse:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Warehouse code or name already exists' });
    }
    res.status(500).json({ success: false, message: error.message || 'Server Error' });
  }
};

// @desc    Update a warehouse (including zones/racks array)
// @route   PUT /api/warehouses/:id
// @access  Private (warehouses.update)
const updateWarehouse = async (req, res) => {
  try {
    const { name, code, location, address, phone, managerId, incharge, isDefault, isActive, zones } = req.body;

    const warehouse = await Warehouse.findOne({ _id: req.params.id, isDeleted: false });

    if (!warehouse) {
      return res.status(404).json({ success: false, message: 'Warehouse not found' });
    }

    // Name uniqueness check if name is changed
    if (name && name.trim().toLowerCase() !== warehouse.name.toLowerCase()) {
      const warehouseExists = await Warehouse.findOne({ 
        name: name.trim(), 
        isDeleted: false 
      }).collation({ locale: 'en', strength: 2 }).lean();
      
      if (warehouseExists) {
        return res.status(400).json({ success: false, message: 'Warehouse with this name already exists' });
      }
      warehouse.name = name.trim();
    }

    if (code) warehouse.code = code.trim().toUpperCase();
    if (location !== undefined) warehouse.location = location;
    if (address !== undefined) warehouse.address = address;
    if (phone !== undefined) warehouse.phone = phone;
    if (managerId !== undefined) warehouse.managerId = managerId || null;
    if (incharge !== undefined) warehouse.incharge = incharge || null;
    if (isActive !== undefined) warehouse.isActive = Boolean(isActive);

    if (isDefault) {
      await Warehouse.updateMany({ _id: { $ne: warehouse._id } }, { isDefault: false });
      warehouse.isDefault = true;
    }
    
    if (zones) {
      warehouse.zones = zones;
    }

    await warehouse.save();

    const updatedWarehouse = await Warehouse.findById(warehouse._id)
      .populate('managerId', 'name email phone avatar')
      .populate('incharge', 'name email phone avatar')
      .populate('createdBy', 'name email')
      .lean();

    res.json({ success: true, data: updatedWarehouse, message: 'Warehouse updated successfully' });
  } catch (error) {
    console.error('Error updating warehouse:', error);
    res.status(500).json({ success: false, message: error.message || 'Server Error' });
  }
};

// @desc    Delete a warehouse (soft delete)
// @route   DELETE /api/warehouses/:id
// @access  Private (warehouses.delete)
const deleteWarehouse = async (req, res) => {
  try {
    const warehouse = await Warehouse.findOne({ _id: req.params.id, isDeleted: false });

    if (!warehouse) {
      return res.status(404).json({ success: false, message: 'Warehouse not found' });
    }

    // Block deletion if warehouse has stock > 0
    const itemsInWarehouse = await Item.findOne({ 
      "warehouseStock.warehouse": warehouse._id, 
      "warehouseStock.quantity": { $gt: 0 },
      isDeleted: false 
    }).lean();

    if (itemsInWarehouse) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot delete warehouse containing physical stock (e.g., ${itemsInWarehouse.name}). Transfer stock first.` 
      });
    }

    const wasDefault = warehouse.isDefault;
    warehouse.isDeleted = true;
    warehouse.isDefault = false;
    warehouse.isActive = false;
    await warehouse.save();

    // Reassign default to next active warehouse
    if (wasDefault) {
      const nextWh = await Warehouse.findOne({ isDeleted: false, isActive: true });
      if (nextWh) {
        nextWh.isDefault = true;
        await nextWh.save();
      }
    }

    res.json({ success: true, message: 'Warehouse deleted successfully' });
  } catch (error) {
    console.error('Error deleting warehouse:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Bulk import layout (zones & racks) into a warehouse
// @route   POST /api/warehouses/:id/bulk-import-layout
// @access  Private (warehouses.update)
const bulkImportWarehouseLayout = async (req, res) => {
  try {
    const { id } = req.params;
    const { zones = [], mode = 'merge' } = req.body;

    if (!Array.isArray(zones)) {
      return res.status(400).json({ success: false, message: 'Invalid zones array in payload' });
    }

    const warehouse = await Warehouse.findOne({ _id: id, isDeleted: false });
    if (!warehouse) {
      return res.status(404).json({ success: false, message: 'Warehouse not found' });
    }

    if (mode === 'replace') {
      warehouse.zones = zones.map(z => ({
        name: z.name ? String(z.name).trim() : 'Unnamed Zone',
        description: z.description ? String(z.description).trim() : '',
        racks: Array.isArray(z.racks) ? z.racks.map(r => ({
          name: r.name ? String(r.name).trim() : 'Rack 1',
          capacity: r.capacity ? String(r.capacity).trim() : '',
          description: r.description ? String(r.description).trim() : ''
        })) : []
      }));
    } else {
      // mode === 'merge'
      const existingZones = JSON.parse(JSON.stringify(warehouse.zones || []));

      zones.forEach(importZone => {
        const importName = (importZone.name || '').trim();
        if (!importName) return;

        const matchIndex = existingZones.findIndex(ez => ez.name.toLowerCase() === importName.toLowerCase());

        const importRacks = Array.isArray(importZone.racks) ? importZone.racks.map(r => ({
          name: r.name ? String(r.name).trim() : 'Rack',
          capacity: r.capacity ? String(r.capacity).trim() : '',
          description: r.description ? String(r.description).trim() : ''
        })) : [];

        if (matchIndex !== -1) {
          const existingZone = existingZones[matchIndex];
          if (!existingZone.racks) existingZone.racks = [];

          importRacks.forEach(newRack => {
            const rackExists = existingZone.racks.some(er => er.name.toLowerCase() === newRack.name.toLowerCase());
            if (!rackExists) {
              existingZone.racks.push(newRack);
            }
          });

          if (importZone.description && !existingZone.description) {
            existingZone.description = String(importZone.description).trim();
          }
        } else {
          existingZones.push({
            name: importName,
            description: importZone.description ? String(importZone.description).trim() : '',
            racks: importRacks
          });
        }
      });

      warehouse.zones = existingZones;
    }

    await warehouse.save();
    res.json({
      success: true,
      message: `Layout imported successfully (${mode} mode)`,
      data: warehouse
    });
  } catch (error) {
    console.error('Error bulk importing warehouse layout:', error);
    res.status(500).json({ success: false, message: error.message || 'Server Error' });
  }
};

module.exports = {
  getWarehouses,
  getWarehouseById,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
  bulkImportWarehouseLayout
};

