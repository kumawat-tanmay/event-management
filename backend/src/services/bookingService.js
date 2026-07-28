const Booking = require('../models/Booking');
const Quotation = require('../models/Quotation');
const Reservation = require('../models/Reservation');

/**
 * Generate auto-incrementing Booking ID: BKG-YYMMDD-001
 */
const generateBookingId = async () => {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const prefix = `BKG-${yy}${mm}${dd}`;

  // Find latest booking with same date prefix
  const latest = await Booking.findOne({ bookingId: { $regex: `^${prefix}` } })
    .sort({ bookingId: -1 })
    .lean();

  let seq = 1;
  if (latest) {
    const parts = latest.bookingId.split('-');
    const lastSeq = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastSeq)) seq = lastSeq + 1;
  }

  return `${prefix}-${String(seq).padStart(3, '0')}`;
};

/**
 * Convert an approved Quotation into a confirmed Booking.
 * Copies the quotation snapshot (items, totals, dates) into a new Booking document.
 * Updates the Quotation status to 'Converted'.
 *
 * @param {String} quotationId - Mongoose ObjectId of the Quotation
 * @param {String} userId - The user performing the conversion
 * @returns {Object} The created Booking document
 */
const convertQuotationToBooking = async (quotationId, userId) => {
  const quotation = await Quotation.findOne({
    _id: quotationId,
    isDeleted: false
  });

  if (!quotation) {
    throw new Error('Quotation not found');
  }

  if (quotation.status === 'Converted') {
    throw new Error('Quotation is already converted to a booking');
  }

  if (quotation.status === 'Rejected') {
    throw new Error('Cannot convert a rejected quotation');
  }

  const bookingId = await generateBookingId();

  const booking = await Booking.create({
    bookingId,
    quotation: quotation._id,
    customer: quotation.customer,
    eventTitle: quotation.eventTitle,
    eventType: quotation.eventType,
    eventStartDate: quotation.eventStartDate,
    eventEndDate: quotation.eventEndDate,
    venueAddress: quotation.venueAddress,
    items: quotation.items,
    subtotal: quotation.subtotal,
    transportCharges: quotation.transportCharges,
    labourCharges: quotation.labourCharges,
    taxRate: quotation.taxRate,
    taxAmount: quotation.taxAmount,
    grandTotal: quotation.grandTotal,
    advanceRequired: Math.round(quotation.grandTotal * 0.3), // Default 30% advance
    balanceAmount: quotation.grandTotal,
    status: 'Draft',
    createdBy: userId
  });

  // Mark quotation as converted
  quotation.status = 'Converted';
  await quotation.save();

  // Auto-create pending reservation
  await createPendingReservation(booking, userId);

  return booking;
};

/**
 * Automatically create a pending stock reservation for a booking.
 *
 * @param {Object} booking - Booking document
 * @param {String} userId - The user creating the reservation
 */
const createPendingReservation = async (booking, userId) => {
  try {
    const existing = await Reservation.findOne({ bookingId: booking._id });
    if (existing) return existing;

    const itemsToReserve = booking.items.map(bItem => ({
      item: bItem.item,
      name: bItem.name,
      code: bItem.code,
      requestedQty: bItem.qty || bItem.quantity || 0,
      lockedQty: 0,
      isFullyLocked: false,
    }));

    const reservation = await Reservation.create({
      bookingId: booking._id,
      quotationId: booking.quotation || undefined,
      customer: booking.customer,
      status: 'Pending',
      items: itemsToReserve,
      eventStartDate: booking.eventStartDate,
      eventEndDate: booking.eventEndDate,
      createdBy: userId,
    });

    return reservation;
  } catch (error) {
    console.error('Error creating pending reservation:', error);
  }
};

module.exports = { generateBookingId, convertQuotationToBooking, createPendingReservation };
