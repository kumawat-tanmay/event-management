const mongoose = require('mongoose');
const Reservation = require('../models/Reservation');
const StockLock = require('../models/StockLock');
const Booking = require('../models/Booking');
const Warehouse = require('../models/Warehouse');
const Item = require('../models/Item');
const { getPeakLockedQty } = require('../services/stockService');

/**
 * 1. Initialize Reservation from Booking
 * When a booking is confirmed, we create a pending reservation.
 */
exports.createReservation = async (req, res, next) => {
  try {
    const { bookingId } = req.body;

    const booking = await Booking.findById(bookingId).populate('items.item');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    
    // Check if reservation already exists
    const existing = await Reservation.findOne({ bookingId });
    if (existing) return res.status(400).json({ success: false, message: 'Reservation already exists for this booking' });

    const itemsToReserve = booking.items.map(bItem => ({
      item: bItem.item._id || bItem.item,
      name: bItem.name || bItem.item?.name || 'Unknown Item',
      code: bItem.code || bItem.item?.code || 'UNKNOWN',
      requestedQty: bItem.qty || bItem.quantity || 0,
      lockedQty: 0,
      isFullyLocked: false,
    }));

    const reservation = new Reservation({
      bookingId: booking._id,
      quotationId: booking.quotation || booking.quotationId,
      customer: booking.customer,
      status: 'Pending',
      items: itemsToReserve,
      eventStartDate: booking.eventStartDate || booking.eventDates?.startDate,
      eventEndDate: booking.eventEndDate || booking.eventDates?.endDate,
      createdBy: req.user._id || req.user.id,
    });

    await reservation.save();
    return res.status(201).json({ success: true, data: reservation, message: 'Reservation created successfully' });
  } catch (err) {
    next(err);
  }
};

/**
 * 2. Suggest Split Algorithm
 * Takes requested items and Godown availability, suggests best split.
 */
exports.suggestSplit = async (req, res, next) => {
  try {
    const { reservationId } = req.body;
    
    const reservation = await Reservation.findById(reservationId);
    if (!reservation) return res.status(404).json({ success: false, message: 'Reservation not found' });

    // Fetch all warehouses
    const warehouses = await Warehouse.find({ isDeleted: false }).sort({ createdAt: 1 }); // Assuming first created is Main godown
    
    const suggestions = [];

    // For each item, we need to find overlapping locks across all bookings
    for (const resItem of reservation.items) {
      const item = await Item.findById(resItem.item);
      const totalRequested = resItem.requestedQty;
      let remainingToFulfill = totalRequested;
      
      const itemSplit = {
        itemId: item._id,
        name: item.name,
        code: item.code,
        requested: totalRequested,
        splits: [],
        canFulfill: false
      };

      // Greedy allocation through warehouses
      for (const warehouse of warehouses) {
        if (remainingToFulfill <= 0) break;

        // 1. Get Base Stock from Item warehouseStock array
        const whStock = (item.warehouseStock || []).find(
          ws => ws.warehouse.toString() === warehouse._id.toString()
        );
        const physicalStock = whStock ? whStock.quantity : 0;
        const dispatched = whStock ? (whStock.dispatched || 0) : 0;
        const damaged = whStock ? (whStock.damaged || 0) : 0;

        // 2. Query peak overlapping locks (excluding this reservation's own bookingId)
        const peakLocked = await getPeakLockedQty(
          item._id,
          warehouse._id,
          reservation.eventStartDate,
          reservation.eventEndDate,
          reservation.bookingId
        );

        const availableHere = Math.max(0, physicalStock - peakLocked - dispatched - damaged);

        if (availableHere > 0) {
          const allocateQty = Math.min(availableHere, remainingToFulfill);
          itemSplit.splits.push({
            warehouseId: warehouse._id,
            warehouseName: warehouse.name,
            allocateQty,
          });
          remainingToFulfill -= allocateQty;
        }
      }

      itemSplit.canFulfill = remainingToFulfill === 0;
      suggestions.push(itemSplit);
    }

    return res.status(200).json({ success: true, data: suggestions, message: 'AI split suggestions generated' });
  } catch (err) {
    next(err);
  }
};

/**
 * 3. Lock Stock (Transaction with concurrency control)
 */
exports.lockStock = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { reservationId } = req.params;
    const { locks } = req.body; // Array of { itemId, warehouseId, qty }

    const reservation = await Reservation.findById(reservationId).session(session);
    if (!reservation) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Reservation not found' });
    }

    if (reservation.status === 'Locked') {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: 'Stock already locked for this reservation' });
    }

    const newLocks = [];

    // Process each user-confirmed lock allocation
    for (const lockReq of locks) {
      // Validation to ensure we don't exceed what was originally requested
      const resItem = reservation.items.find(i => i.item.toString() === lockReq.itemId);
      if (!resItem) throw new Error(`Item ${lockReq.itemId} not in reservation`);

      // Retrieve actual item and check current live availability
      const item = await Item.findById(lockReq.itemId).session(session);
      if (!item) throw new Error(`Item not found`);

      const whStock = (item.warehouseStock || []).find(
        ws => ws.warehouse.toString() === lockReq.warehouseId.toString()
      );
      const physicalStock = whStock ? whStock.quantity : 0;
      const dispatched = whStock ? (whStock.dispatched || 0) : 0;
      const damaged = whStock ? (whStock.damaged || 0) : 0;

      // Peak overlapping locks (excluding this reservation's bookingId)
      const peakLocked = await getPeakLockedQty(
        lockReq.itemId,
        lockReq.warehouseId,
        reservation.eventStartDate,
        reservation.eventEndDate,
        reservation.bookingId
      );

      const availableHere = Math.max(0, physicalStock - peakLocked - dispatched - damaged);

      if (lockReq.qty > availableHere) {
        throw new Error(
          `Insufficient stock for item "${resItem.name}" at warehouse. Requested: ${lockReq.qty}, Available: ${availableHere}`
        );
      }

      const stockLock = new StockLock({
        warehouseId: lockReq.warehouseId,
        reservationId: reservation._id,
        bookingId: reservation.bookingId,
        itemId: lockReq.itemId,
        lockedQty: lockReq.qty,
        startDate: reservation.eventStartDate,
        endDate: reservation.eventEndDate,
        lockedBy: req.user._id || req.user.id,
      });

      await stockLock.save({ session });
      newLocks.push(stockLock);

      // Update reservation item status
      resItem.lockedQty += lockReq.qty;
      if (resItem.lockedQty >= resItem.requestedQty) {
        resItem.isFullyLocked = true;
      }
    }

    // Check if all items are fully locked
    const allLocked = reservation.items.every(i => i.isFullyLocked);
    reservation.status = allLocked ? 'Locked' : 'Auto-Split';
    
    await reservation.save({ session });

    // Mark Booking as well
    await Booking.findByIdAndUpdate(reservation.bookingId, { status: 'Stock Locked' }, { session });

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({ success: true, data: reservation, message: 'Stock successfully locked across warehouses' });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

/**
 * 4. Release Stock
 */
exports.releaseStock = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { reservationId } = req.params;
    
    const reservation = await Reservation.findById(reservationId).session(session);
    if (!reservation) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Reservation not found' });
    }

    await StockLock.updateMany(
      { reservationId: reservation._id, isReleased: false },
      { $set: { isReleased: true } },
      { session }
    );

    // Reset reservation item locked quantities
    reservation.items.forEach(item => {
      item.lockedQty = 0;
      item.isFullyLocked = false;
    });
    
    reservation.status = 'Released';
    await reservation.save({ session });

    // Revert Booking status
    await Booking.findByIdAndUpdate(reservation.bookingId, { status: 'Confirmed' }, { session });

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({ success: true, data: reservation, message: 'Stock locks released successfully' });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

/**
 * 5. Get All Reservations
 */
exports.getAllReservations = async (req, res, next) => {
  try {
    const reservations = await Reservation.find({ isDeleted: false })
      .populate('bookingId')
      .populate('customer', 'name phone')
      .sort({ eventStartDate: 1 });
      
    return res.status(200).json({ success: true, data: reservations, message: 'Reservations fetched' });
  } catch (err) {
    next(err);
  }
};

/**
 * 6. Get Reservation By Booking ID
 */
exports.getReservationByBookingId = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const reservation = await Reservation.findOne({ bookingId, isDeleted: false })
      .populate('bookingId', 'bookingId eventTitle eventType status')
      .populate('customer', 'name phone');
      
    if (!reservation) return res.status(404).json({ success: false, message: 'Reservation not found' });

    // Also fetch associated locks
    const locks = await StockLock.find({ reservationId: reservation._id, isReleased: false })
      .populate('warehouseId', 'name')
      .populate('itemId', 'name');

    return res.status(200).json({ success: true, data: { reservation, locks }, message: 'Reservation details fetched' });
  } catch (err) {
    next(err);
  }
};
