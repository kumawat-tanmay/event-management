const Item = require('../models/Item');
const Warehouse = require('../models/Warehouse');
const StockLock = require('../models/StockLock');

/**
 * Calculate the peak concurrent stock locks for an item at a warehouse over overlapping dates.
 *
 * @param {ObjectId} itemId
 * @param {ObjectId} warehouseId
 * @param {Date} startDate
 * @param {Date} endDate
 * @param {ObjectId} [excludeBookingId]
 * @returns {Number} Peak concurrent locked quantity
 */
const getPeakLockedQty = async (itemId, warehouseId, startDate, endDate, excludeBookingId = null) => {
  const query = {
    itemId,
    warehouseId,
    isReleased: false,
    isDeleted: false,
    startDate: { $lte: endDate },
    endDate: { $gte: startDate }
  };

  if (excludeBookingId) {
    query.bookingId = { $ne: excludeBookingId };
  }

  const locks = await StockLock.find(query).lean();

  if (locks.length === 0) return 0;

  // Build event points for peak concurrency calculation
  const events = [];
  for (const lock of locks) {
    events.push({
      time: new Date(lock.startDate).setHours(0, 0, 0, 0),
      change: lock.lockedQty
    });
    // Release event on the day after the lock ends
    const nextDay = new Date(lock.endDate);
    nextDay.setDate(nextDay.getDate() + 1);
    events.push({
      time: nextDay.setHours(0, 0, 0, 0),
      change: -lock.lockedQty
    });
  }

  // Sort events chronologically. Handle release (negative change) before lock (positive change)
  events.sort((a, b) => {
    if (a.time === b.time) {
      return a.change - b.change;
    }
    return a.time - b.time;
  });

  let current = 0;
  let peak = 0;
  const reqStart = new Date(startDate).setHours(0, 0, 0, 0);
  const reqEnd = new Date(endDate).setHours(0, 0, 0, 0);

  for (const event of events) {
    current += event.change;
    if (event.time >= reqStart && event.time <= reqEnd) {
      if (current > peak) peak = current;
    } else if (event.time < reqStart) {
      if (current > peak) peak = current;
    }
  }

  return peak;
};

/**
 * Check multi-warehouse stock availability for a list of items.
 * Phase 6: Includes reservation-aware deductions using StockLocks.
 *
 * @param {Array} requestedItems - [{ item: ObjectId, quantity: Number }]
 * @param {Date} startDate - Event start date
 * @param {Date} endDate - Event end date
 * @param {ObjectId} [excludeBookingId] - Optional booking to exclude from overlap checks
 * @returns {Array} Availability matrix per item per warehouse
 */
const checkMultiWarehouseAvailability = async (requestedItems, startDate, endDate, excludeBookingId = null) => {
  // Fetch all active warehouses
  const warehouses = await Warehouse.find({ isDeleted: false }).lean();

  // Fetch all requested items with their warehouse stock (filtering out invalid item IDs)
  const mongoose = require('mongoose');
  const itemIds = requestedItems
    .filter(ri => ri.item && mongoose.Types.ObjectId.isValid(ri.item))
    .map(ri => ri.item);

  const items = await Item.find({ _id: { $in: itemIds }, isDeleted: false })
    .populate('category', 'name')
    .lean();

  const availability = await Promise.all(requestedItems.map(async (requested) => {
    const itemData = items.find(i => i._id.toString() === (requested.item ? requested.item.toString() : ''));

    if (!itemData) {
      return {
        itemId: requested.item,
        itemName: 'Unknown Item',
        requestedQty: requested.quantity,
        warehouses: [],
        totalAvailable: 0,
        isFullyAvailable: false,
        shortfall: requested.quantity
      };
    }

    // Build per-warehouse availability
    const warehouseAvailability = await Promise.all(warehouses.map(async (wh) => {
      const whStock = (itemData.warehouseStock || []).find(
        ws => ws.warehouse.toString() === wh._id.toString()
      );
      const totalStock = whStock ? whStock.quantity : 0;
      const dispatched = whStock ? (whStock.dispatched || 0) : 0;
      const damaged = whStock ? (whStock.damaged || 0) : 0;

      // Get peak overlapping locks
      const peakLocked = await getPeakLockedQty(itemData._id, wh._id, startDate, endDate, excludeBookingId);

      const available = Math.max(0, totalStock - peakLocked - dispatched - damaged);

      return {
        warehouseId: wh._id,
        warehouseName: wh.name,
        totalStock,
        reserved: peakLocked,
        dispatched,
        damaged,
        available
      };
    }));

    const totalAvailable = warehouseAvailability.reduce((sum, wh) => sum + wh.available, 0);
    const shortfall = Math.max(0, requested.quantity - totalAvailable);

    return {
      itemId: itemData._id,
      itemName: itemData.name,
      itemCode: itemData.code,
      unit: itemData.unit,
      category: itemData.category?.name || '',
      requestedQty: requested.quantity,
      warehouses: warehouseAvailability,
      totalAvailable,
      isFullyAvailable: totalAvailable >= requested.quantity,
      shortfall
    };
  }));

  return availability;
};

module.exports = { checkMultiWarehouseAvailability, getPeakLockedQty };
