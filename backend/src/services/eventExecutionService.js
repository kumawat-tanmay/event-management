const mongoose = require('mongoose');
const EventExecution = require('../models/EventExecution');
const Booking = require('../models/Booking');
const Item = require('../models/Item');
const InventoryLedger = require('../models/InventoryLedger');

/**
 * 1. Create Site Receipt Service
 */
const createSiteReceiptService = async ({ bookingId, dispatchId, materialCondition, remarks, supervisorName, photos, userId }) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new Error('Booking not found');
  }

  const execution = await EventExecution.create({
    bookingId,
    dispatchId,
    type: 'SiteReceipt',
    materialCondition: materialCondition || 'OK',
    remarks: remarks || '',
    supervisorName: supervisorName || 'Supervisor',
    photos: photos || [],
    createdBy: userId,
  });

  return execution;
};

/**
 * 2. Create Site Verification & Photo Upload Service
 */
const createSiteVerificationService = async ({ bookingId, remarks, photos, supervisorName, userId }) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new Error('Booking not found');
  }

  const execution = await EventExecution.create({
    bookingId,
    type: 'Verification',
    status: 'Verified',
    remarks: remarks || '',
    photos: photos || [],
    supervisorName: supervisorName || 'Inspector',
    createdBy: userId,
  });

  return execution;
};

/**
 * 3. Submit Post-Event Return & Perform Atomic Stock Settlement Service
 */
const submitReturnAndSettleService = async ({ bookingId, warehouseId, remarks, returnItems, supervisorName, photos, userId }) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const booking = await Booking.findById(bookingId).session(session);
    if (!booking) {
      await session.abortTransaction();
      throw new Error('Booking not found');
    }

    const execution = new EventExecution({
      bookingId,
      type: 'Return',
      status: 'Settled',
      remarks: remarks || '',
      supervisorName: supervisorName || 'Godown Manager',
      returnItems: returnItems || [],
      photos: photos || [],
      createdBy: userId,
    });

    await execution.save({ session });

    // Stock settlement loop
    for (const rItem of returnItems || []) {
      const itemDoc = await Item.findById(rItem.item).session(session);
      if (itemDoc) {
        const whId = warehouseId || (itemDoc.warehouseStock[0]?.warehouse);
        if (!whId) {
          throw new Error(`Cannot determine warehouse for item ${itemDoc.name}. Please select a destination warehouse explicitly.`);
        }
        let whEntry = itemDoc.warehouseStock.find(ws => ws.warehouse.toString() === whId.toString());

        if (!whEntry) {
          itemDoc.warehouseStock.push({
            warehouse: whId,
            quantity: 0,
            dispatched: 0,
            damaged: Number(rItem.returnedDamagedQty || 0)
          });
          whEntry = itemDoc.warehouseStock[itemDoc.warehouseStock.length - 1];
        } else {
          // Decrement dispatched stock by good + damaged + missing
          const totalReturned = Number(rItem.returnedGoodQty || 0) + Number(rItem.returnedDamagedQty || 0) + Number(rItem.missingQty || 0);
          whEntry.dispatched = Math.max(0, (whEntry.dispatched || 0) - totalReturned);

          // Increment damaged stock pool
          whEntry.damaged = (whEntry.damaged || 0) + Number(rItem.returnedDamagedQty || 0);

          // Reduce total stock quantity for missing items
          if (Number(rItem.missingQty || 0) > 0) {
            whEntry.quantity = Math.max(0, (whEntry.quantity || 0) - Number(rItem.missingQty || 0));
            // Crucial: Recalculate totalStock for the item across all warehouses
            itemDoc.totalStock = itemDoc.warehouseStock.reduce((acc, ws) => acc + ws.quantity, 0);
          }
        }

        // Recalculate available stock
        itemDoc.availableStock = itemDoc.warehouseStock.reduce(
          (acc, ws) => acc + Math.max(0, ws.quantity - (ws.dispatched || 0) - (ws.damaged || 0)),
          0
        );

        await itemDoc.save({ session });

        // Record Inventory Ledger entry
        const balanceAfter = Math.max(0, (whEntry.quantity || 0) - (whEntry.dispatched || 0) - (whEntry.damaged || 0));
        await InventoryLedger.create(
          [
            {
              item: itemDoc._id,
              warehouse: whId,
              type: 'RETURN',
              quantity: Number(rItem.returnedGoodQty || 0),
              balanceBefore: balanceAfter - Number(rItem.returnedGoodQty || 0),
              balanceAfter,
              remarks: `Returned Good: ${rItem.returnedGoodQty}, Damaged: ${rItem.returnedDamagedQty}, Missing: ${rItem.missingQty} for Booking ${booking.bookingId}`,
              performedBy: userId,
            },
          ],
          { session }
        );
      }
    }

    // Update booking status to Completed
    booking.status = 'Completed';
    await booking.save({ session });

    await session.commitTransaction();
    session.endSession();

    return execution;
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

/**
 * 4. Get Execution Records by Booking ID Service
 */
const getExecutionsByBookingService = async (bookingId) => {
  const executions = await EventExecution.find({ bookingId, isDeleted: false })
    .populate('createdBy', 'name email')
    .populate('returnItems.item', 'name code category')
    .sort({ createdAt: -1 })
    .lean();

  return executions;
};

/**
 * 5. Get All Executions Service
 */
const getExecutionsService = async (type) => {
  const query = { isDeleted: false };
  if (type) query.type = type;

  const executions = await EventExecution.find(query)
    .populate('bookingId', 'bookingId eventTitle customer eventStartDate eventEndDate venueAddress status')
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 })
    .lean();

  return executions;
};

module.exports = {
  createSiteReceiptService,
  createSiteVerificationService,
  submitReturnAndSettleService,
  getExecutionsByBookingService,
  getExecutionsService,
};
