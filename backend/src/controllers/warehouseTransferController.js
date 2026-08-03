const mongoose = require('mongoose');
const WarehouseTransfer = require('../models/WarehouseTransfer');
const Item = require('../models/Item');
const InventoryLedger = require('../models/InventoryLedger');
const Counter = require('../models/Counter');

/**
 * Auto-generate Transfer Number: TRF-YYMMDD-001
 */
const generateTransferNumber = async () => {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const prefix = `TRF-${yy}${mm}${dd}`;

  const counter = await Counter.findOneAndUpdate(
    { id: prefix },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  return `${prefix}-${String(counter.seq).padStart(3, '0')}`;
};

/**
 * 1. Create Inter-Godown Transfer Request
 */
exports.createTransfer = async (req, res, next) => {
  try {
    const { fromWarehouse, toWarehouse, items, remarks } = req.body;

    if (fromWarehouse.toString() === toWarehouse.toString()) {
      return res.status(400).json({ success: false, message: 'Source and Destination warehouses must be different' });
    }

    const transferNumber = await generateTransferNumber();

    const transfer = new WarehouseTransfer({
      transferNumber,
      fromWarehouse,
      toWarehouse,
      items,
      remarks,
      status: 'Requested',
      requestedBy: req.user?._id || req.user?.id,
    });

    await transfer.save();

    const populated = await WarehouseTransfer.findById(transfer._id)
      .populate('fromWarehouse', 'name code')
      .populate('toWarehouse', 'name code')
      .populate('requestedBy', 'name')
      .lean();

    return res.status(201).json({ success: true, data: populated, message: 'Stock Transfer requested successfully' });
  } catch (err) {
    next(err);
  }
};

/**
 * 2. Approve and Dispatch Transfer (Deducts stock from Source Godown)
 */
exports.approveAndDispatchTransfer = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const transfer = await WarehouseTransfer.findOne({ _id: req.params.id, isDeleted: false }).session(session);

    if (!transfer) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Transfer request not found' });
    }

    if (transfer.status !== 'Requested') {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: `Cannot approve transfer in status ${transfer.status}` });
    }

    // Deduct items from source warehouse
    for (const tItem of transfer.items) {
      const itemDoc = await Item.findById(tItem.item).session(session);
      if (!itemDoc) throw new Error(`Item ${tItem.name} not found`);

      let whEntry = itemDoc.warehouseStock.find(ws => ws.warehouse.toString() === transfer.fromWarehouse.toString());
      const balanceBefore = whEntry ? whEntry.quantity : 0;

      if (!whEntry || whEntry.quantity < tItem.quantity) {
        throw new Error(`Insufficient stock for ${itemDoc.name} at Source Warehouse (Available: ${balanceBefore}, Requested: ${tItem.quantity})`);
      }

      whEntry.quantity -= tItem.quantity;

      // Recalculate available stock
      itemDoc.totalStock = itemDoc.warehouseStock.reduce((acc, ws) => acc + ws.quantity, 0);
      itemDoc.availableStock = itemDoc.warehouseStock.reduce(
        (acc, ws) => acc + Math.max(0, ws.quantity - (ws.dispatched || 0) - (ws.damaged || 0)),
        0
      );

      await itemDoc.save({ session });

      // Record Inventory Ledger entry
      await InventoryLedger.create(
        [
          {
            item: itemDoc._id,
            warehouse: transfer.fromWarehouse,
            type: 'TRANSFER_OUT',
            quantity: tItem.quantity,
            balanceBefore,
            balanceAfter: whEntry.quantity,
            remarks: `Inter-Godown Transfer Out to Destination Warehouse via ${transfer.transferNumber}`,
            performedBy: req.user?._id || req.user?.id,
          },
        ],
        { session }
      );
    }

    transfer.status = 'In-Transit';
    transfer.approvedBy = req.user?._id || req.user?.id;
    await transfer.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({ success: true, data: transfer, message: 'Transfer approved and dispatched' });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

/**
 * 3. Receive Transfer (Adds stock to Destination Godown)
 */
exports.receiveTransfer = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const transfer = await WarehouseTransfer.findOne({ _id: req.params.id, isDeleted: false }).session(session);

    if (!transfer) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Transfer request not found' });
    }

    if (transfer.status !== 'In-Transit') {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: `Cannot receive transfer in status ${transfer.status}` });
    }

    // Add items to destination warehouse
    for (const tItem of transfer.items) {
      const itemDoc = await Item.findById(tItem.item).session(session);
      if (!itemDoc) throw new Error(`Item ${tItem.name} not found`);

      let whEntry = itemDoc.warehouseStock.find(ws => ws.warehouse.toString() === transfer.toWarehouse.toString());
      const balanceBefore = whEntry ? whEntry.quantity : 0;

      if (!whEntry) {
        itemDoc.warehouseStock.push({
          warehouse: transfer.toWarehouse,
          quantity: tItem.quantity,
          dispatched: 0,
          damaged: 0
        });
      } else {
        whEntry.quantity += tItem.quantity;
      }

      // Recalculate available stock
      itemDoc.totalStock = itemDoc.warehouseStock.reduce((acc, ws) => acc + ws.quantity, 0);
      itemDoc.availableStock = itemDoc.warehouseStock.reduce(
        (acc, ws) => acc + Math.max(0, ws.quantity - (ws.dispatched || 0) - (ws.damaged || 0)),
        0
      );

      await itemDoc.save({ session });

      // Record Inventory Ledger entry
      await InventoryLedger.create(
        [
          {
            item: itemDoc._id,
            warehouse: transfer.toWarehouse,
            type: 'TRANSFER_IN',
            quantity: tItem.quantity,
            balanceBefore,
            balanceAfter: balanceBefore + tItem.quantity,
            remarks: `Inter-Godown Transfer In from Source Warehouse via ${transfer.transferNumber}`,
            performedBy: req.user?._id || req.user?.id,
          },
        ],
        { session }
      );
    }

    transfer.status = 'Received';
    transfer.receivedBy = req.user?._id || req.user?.id;
    transfer.receivedAt = new Date();
    await transfer.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({ success: true, data: transfer, message: 'Stock transfer received and stock updated' });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

/**
 * 4. Get All Transfers
 */
exports.getTransfers = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const query = { isDeleted: false };

    if (status && status !== 'All') {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { transferNumber: { $regex: search, $options: 'i' } },
        { remarks: { $regex: search, $options: 'i' } },
      ];
    }

    const transfers = await WarehouseTransfer.find(query)
      .populate('fromWarehouse', 'name code')
      .populate('toWarehouse', 'name code')
      .populate('requestedBy', 'name')
      .populate('approvedBy', 'name')
      .populate('receivedBy', 'name')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ success: true, data: transfers });
  } catch (err) {
    next(err);
  }
};

/**
 * 5. Cancel / Reject Transfer Request
 */
exports.cancelTransfer = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const transfer = await WarehouseTransfer.findOne({ _id: req.params.id, isDeleted: false }).session(session);

    if (!transfer) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Transfer request not found' });
    }

    if (transfer.status === 'Received') {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Cannot cancel a completed/received transfer' });
    }

    // Revert inventory stock if it was shipped (In-Transit)
    if (transfer.status === 'In-Transit') {
      const fromWarehouseId = transfer.fromWarehouse;
      for (const itemEntry of transfer.items) {
        const itemDoc = await Item.findById(itemEntry.item).session(session);
        if (itemDoc) {
          let whEntry = itemDoc.warehouseStock.find(ws => ws.warehouse.toString() === fromWarehouseId.toString());
          if (whEntry) {
            // Re-add quantity to source warehouse
            whEntry.quantity = (whEntry.quantity || 0) + itemEntry.quantity;
            
            // Recalculate available and total stock
            itemDoc.totalStock = itemDoc.warehouseStock.reduce((acc, ws) => acc + ws.quantity, 0);
            itemDoc.availableStock = itemDoc.warehouseStock.reduce(
              (acc, ws) => acc + Math.max(0, ws.quantity - (ws.dispatched || 0) - (ws.damaged || 0)),
              0
            );
            await itemDoc.save({ session });
          }
        }
      }
    }

    transfer.status = 'Rejected';
    await transfer.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({ success: true, message: 'Transfer request cancelled successfully' });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

/**
 * 6. Get Single Transfer
 */
exports.getTransferById = async (req, res, next) => {
  try {
    const transfer = await WarehouseTransfer.findOne({ _id: req.params.id, isDeleted: false })
      .populate('fromWarehouse', 'name location code phone')
      .populate('toWarehouse', 'name location code phone')
      .populate('requestedBy', 'name email')
      .populate('approvedBy', 'name email')
      .populate('receivedBy', 'name email')
      .lean();

    if (!transfer) return res.status(404).json({ success: false, message: 'Transfer request not found' });

    return res.status(200).json({ success: true, data: transfer });
  } catch (err) {
    next(err);
  }
};

/**
 * 7. Update Transfer Request (Only allowed in 'Requested' status)
 */
exports.updateTransfer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { fromWarehouse, toWarehouse, items, remarks } = req.body;

    if (fromWarehouse.toString() === toWarehouse.toString()) {
      return res.status(400).json({ success: false, message: 'Source and Destination warehouses must be different' });
    }

    const transfer = await WarehouseTransfer.findOne({ _id: id, isDeleted: false });
    if (!transfer) return res.status(404).json({ success: false, message: 'Transfer request not found' });

    if (transfer.status !== 'Requested') {
      // Only allow updating remarks if shipped or completed
      transfer.remarks = remarks;

      await transfer.save();

      const populated = await WarehouseTransfer.findById(transfer._id)
        .populate('fromWarehouse', 'name code')
        .populate('toWarehouse', 'name code')
        .populate('requestedBy', 'name')
        .lean();

      return res.status(200).json({ success: true, data: populated, message: 'Transfer remarks updated successfully (transfer locked)' });
    }

    transfer.fromWarehouse = fromWarehouse;
    transfer.toWarehouse = toWarehouse;
    transfer.remarks = remarks;
    transfer.items = items;

    await transfer.save();

    const populated = await WarehouseTransfer.findById(transfer._id)
      .populate('fromWarehouse', 'name code')
      .populate('toWarehouse', 'name code')
      .populate('requestedBy', 'name')
      .lean();

    return res.status(200).json({ success: true, data: populated, message: 'Stock Transfer request updated successfully' });
  } catch (err) {
    next(err);
  }
};

/**
 * 8. Soft Delete Stock Transfer (with Stock Reversion)
 */
exports.deleteTransfer = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;

    const transfer = await WarehouseTransfer.findOne({ _id: id, isDeleted: false }).session(session);
    if (!transfer) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Transfer request not found' });
    }

    // Revert inventory stock if it was shipped (In-Transit)
    if (transfer.status === 'In-Transit') {
      const fromWarehouseId = transfer.fromWarehouse;
      for (const itemEntry of transfer.items) {
        const itemDoc = await Item.findById(itemEntry.item).session(session);
        if (itemDoc) {
          let whEntry = itemDoc.warehouseStock.find(ws => ws.warehouse.toString() === fromWarehouseId.toString());
          if (whEntry) {
            // Re-add quantity to source warehouse
            whEntry.quantity = (whEntry.quantity || 0) + itemEntry.quantity;
            
            // Recalculate available and total stock
            itemDoc.totalStock = itemDoc.warehouseStock.reduce((acc, ws) => acc + ws.quantity, 0);
            itemDoc.availableStock = itemDoc.warehouseStock.reduce(
              (acc, ws) => acc + Math.max(0, ws.quantity - (ws.dispatched || 0) - (ws.damaged || 0)),
              0
            );
            await itemDoc.save({ session });
          }
        }
      }
    }

    transfer.isDeleted = true;
    await transfer.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({ success: true, message: 'Stock Transfer deleted successfully and stock restored' });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};


