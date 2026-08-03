const mongoose = require('mongoose');
const Dispatch = require('../models/Dispatch');
const Booking = require('../models/Booking');
const Item = require('../models/Item');
const InventoryLedger = require('../models/InventoryLedger');
const Counter = require('../models/Counter');
const StockLock = require('../models/StockLock');

/**
 * Auto-generate Dispatch Number: DSP-YYMMDD-001
 */
const generateDispatchNumber = async () => {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const prefix = `DSP-${yy}${mm}${dd}`;

  const counter = await Counter.findOneAndUpdate(
    { id: prefix },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  return `${prefix}-${String(counter.seq).padStart(3, '0')}`;
};

/**
 * 1. Create Dispatch / Loading Slip
 * Executes stock state update in Item.warehouseStock and creates InventoryLedger entry.
 */
exports.createDispatch = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { bookingId, warehouseId, driverName, driverPhone, vehicleNumber, gatePassNumber, items } = req.body;

    const booking = await Booking.findById(bookingId).session(session);
    if (!booking) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const dispatchNumber = await generateDispatchNumber();

    const dispatch = new Dispatch({
      dispatchNumber,
      bookingId,
      warehouseId,
      driverName,
      driverPhone,
      vehicleNumber,
      gatePassNumber: gatePassNumber || `GP-${Math.floor(100000 + Math.random() * 900000)}`,
      status: 'Loading',
      items,
      createdBy: req.user ? (req.user._id || req.user.id) : null,
    });

    await dispatch.save({ session });

    // Process inventory updates for each dispatched item
    for (const dItem of items) {
      const itemDoc = await Item.findById(dItem.item).session(session);
      if (itemDoc) {
        let whEntry = itemDoc.warehouseStock.find(ws => ws.warehouse.toString() === warehouseId.toString());
        const balanceBefore = whEntry ? whEntry.quantity : 0;

        if (!whEntry) {
          itemDoc.warehouseStock.push({
            warehouse: warehouseId,
            quantity: 0,
            dispatched: dItem.dispatchedQty,
            damaged: 0
          });
        } else {
          whEntry.dispatched = (whEntry.dispatched || 0) + Number(dItem.dispatchedQty);
        }

        // Recalculate available stock
        itemDoc.availableStock = itemDoc.warehouseStock.reduce(
          (acc, ws) => acc + Math.max(0, ws.quantity - (ws.dispatched || 0) - (ws.damaged || 0)),
          0
        );

        await itemDoc.save({ session });

        // Release corresponding stock locks since stock is now formally dispatched
        await StockLock.updateMany(
          { bookingId, itemId: dItem.item, isReleased: false },
          { $set: { isReleased: true, isDeleted: true } },
          { session }
        );

        // Record Inventory Ledger entry
        await InventoryLedger.create(
          [
            {
              item: itemDoc._id,
              warehouse: warehouseId,
              type: 'DISPATCH',
              quantity: dItem.dispatchedQty,
              balanceBefore,
              balanceAfter: Math.max(0, balanceBefore - dItem.dispatchedQty),
              remarks: `Dispatched for Booking ${booking.bookingId} via Gate Pass ${dispatch.gatePassNumber}`,
              performedBy: req.user?._id || req.user?.id,
            },
          ],
          { session }
        );
      }
    }

    // Update booking status to InProgress
    booking.status = 'InProgress';
    await booking.save({ session });

    await session.commitTransaction();
    session.endSession();

    const populated = await Dispatch.findById(dispatch._id)
      .populate('bookingId', 'bookingId eventTitle eventStartDate eventEndDate customer')
      .populate('warehouseId', 'name location')
      .lean();

    return res.status(201).json({ success: true, data: populated, message: 'Dispatch / Loading Slip created successfully' });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

/**
 * 2. Get All Dispatches
 */
exports.getDispatches = async (req, res, next) => {
  try {
    const { status, search, warehouseId, bookingId } = req.query;
    const query = { isDeleted: false };

    if (bookingId) {
      query.bookingId = bookingId;
    }
    if (status && status !== 'All') {
      query.status = status;
    }
    if (warehouseId) {
      query.warehouseId = warehouseId;
    }
    if (search) {
      query.$or = [
        { dispatchNumber: { $regex: search, $options: 'i' } },
        { driverName: { $regex: search, $options: 'i' } },
        { vehicleNumber: { $regex: search, $options: 'i' } },
        { gatePassNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const dispatches = await Dispatch.find(query)
      .populate('bookingId', 'bookingId eventTitle customer')
      .populate('warehouseId', 'name code')
      .populate('createdBy', 'name')
      .sort({ dispatchedAt: -1 })
      .lean();

    return res.status(200).json({ success: true, data: dispatches });
  } catch (err) {
    next(err);
  }
};

/**
 * 3. Get Single Dispatch
 */
exports.getDispatchById = async (req, res, next) => {
  try {
    const dispatch = await Dispatch.findOne({ _id: req.params.id, isDeleted: false })
      .populate('bookingId')
      .populate('warehouseId', 'name location code phone')
      .populate('createdBy', 'name email')
      .lean();

    if (!dispatch) return res.status(404).json({ success: false, message: 'Dispatch not found' });

    return res.status(200).json({ success: true, data: dispatch });
  } catch (err) {
    next(err);
  }
};

/**
 * 4. Update Dispatch Status (e.g., In-Transit -> Delivered)
 */
exports.updateDispatchStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const dispatch = await Dispatch.findOne({ _id: req.params.id, isDeleted: false });

    if (!dispatch) return res.status(404).json({ success: false, message: 'Dispatch not found' });

    dispatch.status = status;
    if (status === 'Delivered') {
      dispatch.deliveredAt = new Date();
    }

    await dispatch.save();

    return res.status(200).json({ success: true, data: dispatch, message: `Dispatch status updated to ${status}` });
  } catch (err) {
    next(err);
  }
};

/**
 * 5. Update Dispatch (Only allowed in 'Loading' status)
 */
exports.updateDispatch = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { driverName, driverPhone, vehicleNumber, gatePassNumber, items } = req.body;

    const dispatch = await Dispatch.findOne({ _id: id, isDeleted: false }).session(session);
    if (!dispatch) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Dispatch not found' });
    }

    if (dispatch.status !== 'Loading') {
      // Only allow updating driver and vehicle info if transit/delivered
      dispatch.driverName = driverName;
      dispatch.driverPhone = driverPhone;
      dispatch.vehicleNumber = vehicleNumber;
      if (gatePassNumber) dispatch.gatePassNumber = gatePassNumber;

      await dispatch.save({ session });
      await session.commitTransaction();
      session.endSession();

      const populated = await Dispatch.findById(dispatch._id)
        .populate('bookingId', 'bookingId eventTitle eventStartDate eventEndDate customer')
        .populate('warehouseId', 'name location')
        .lean();

      return res.status(200).json({ success: true, data: populated, message: 'Driver & vehicle details updated successfully (dispatch locked)' });
    }

    const warehouseId = dispatch.warehouseId;

    // 1. Revert previous inventory dispatched quantities
    for (const oldItem of dispatch.items) {
      const itemDoc = await Item.findById(oldItem.item).session(session);
      if (itemDoc) {
        let whEntry = itemDoc.warehouseStock.find(ws => ws.warehouse.toString() === warehouseId.toString());
        if (whEntry) {
          whEntry.dispatched = Math.max(0, (whEntry.dispatched || 0) - oldItem.dispatchedQty);
          // Recalculate available stock
          itemDoc.availableStock = itemDoc.warehouseStock.reduce(
            (acc, ws) => acc + Math.max(0, ws.quantity - (ws.dispatched || 0) - (ws.damaged || 0)),
            0
          );
          await itemDoc.save({ session });
        }
      }
    }

    // 2. Apply new inventory dispatched quantities
    for (const newItem of items) {
      const itemDoc = await Item.findById(newItem.item).session(session);
      if (itemDoc) {
        let whEntry = itemDoc.warehouseStock.find(ws => ws.warehouse.toString() === warehouseId.toString());
        if (!whEntry) {
          itemDoc.warehouseStock.push({
            warehouse: warehouseId,
            quantity: 0,
            dispatched: newItem.dispatchedQty,
            damaged: 0
          });
        } else {
          whEntry.dispatched = (whEntry.dispatched || 0) + Number(newItem.dispatchedQty);
        }

        // Recalculate available stock
        itemDoc.availableStock = itemDoc.warehouseStock.reduce(
          (acc, ws) => acc + Math.max(0, ws.quantity - (ws.dispatched || 0) - (ws.damaged || 0)),
          0
        );
        await itemDoc.save({ session });
      }
    }

    // 3. Update dispatch fields
    dispatch.driverName = driverName;
    dispatch.driverPhone = driverPhone;
    dispatch.vehicleNumber = vehicleNumber;
    if (gatePassNumber) dispatch.gatePassNumber = gatePassNumber;
    dispatch.items = items;

    await dispatch.save({ session });

    await session.commitTransaction();
    session.endSession();

    const populated = await Dispatch.findById(dispatch._id)
      .populate('bookingId', 'bookingId eventTitle eventStartDate eventEndDate customer')
      .populate('warehouseId', 'name location')
      .lean();

    return res.status(200).json({ success: true, data: populated, message: 'Dispatch updated successfully' });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

/**
 * 6. Soft Delete Dispatch (with Stock Reversion)
 */
exports.deleteDispatch = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;

    const dispatch = await Dispatch.findOne({ _id: id, isDeleted: false }).session(session);
    if (!dispatch) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Dispatch not found' });
    }

    const warehouseId = dispatch.warehouseId;

    // Revert inventory dispatched quantities
    for (const oldItem of dispatch.items) {
      const itemDoc = await Item.findById(oldItem.item).session(session);
      if (itemDoc) {
        let whEntry = itemDoc.warehouseStock.find(ws => ws.warehouse.toString() === warehouseId.toString());
        if (whEntry) {
          whEntry.dispatched = Math.max(0, (whEntry.dispatched || 0) - oldItem.dispatchedQty);
          // Recalculate available stock
          itemDoc.availableStock = itemDoc.warehouseStock.reduce(
            (acc, ws) => acc + Math.max(0, ws.quantity - (ws.dispatched || 0) - (ws.damaged || 0)),
            0
          );
          await itemDoc.save({ session });

          // Record Inventory Ledger reversal entry
          await InventoryLedger.create(
            [
              {
                item: itemDoc._id,
                warehouse: warehouseId,
                type: 'ADJUSTMENT',
                quantity: oldItem.dispatchedQty,
                balanceBefore: whEntry.quantity,
                balanceAfter: whEntry.quantity, // Physical stock doesn't change, only dispatched flag
                remarks: `Dispatch ${dispatch.dispatchNumber} deleted. Dispatched stock reversed.`,
                performedBy: req.user ? (req.user._id || req.user.id) : null,
              },
            ],
            { session }
          );
        }
      }
    }

    // Mark as deleted
    dispatch.isDeleted = true;
    await dispatch.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({ success: true, message: 'Dispatch deleted successfully and godown stock restored' });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

