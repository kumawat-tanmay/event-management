const Booking = require('../models/Booking');
const { generateBookingId, createPendingReservation } = require('../services/bookingService');
const { calculateQuotationTotals } = require('../services/quotationService');

// Helper to sanitize empty ObjectId fields
const sanitizePayload = (body) => {
  const payload = { ...body };
  if (payload.customer === '' || payload.customer === null) delete payload.customer;
  if (payload.quotation === '' || payload.quotation === null) delete payload.quotation;
  if (payload.assignedSupervisor === '' || payload.assignedSupervisor === null) delete payload.assignedSupervisor;
  return payload;
};

// ─── GET /api/bookings ──────────────────────────────────────────────────────
// @desc    List bookings with pagination, search, status filter
const getBookings = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 50 } = req.query;
    const query = { isDeleted: false };

    if (status && status !== 'All') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { bookingId: { $regex: search, $options: 'i' } },
        { eventTitle: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Booking.countDocuments(query);
    const data = await Booking.find(query)
      .populate('customer', 'name phone type')
      .populate('quotation', 'quotationId')
      .populate('assignedSupervisor', 'name')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    // Aggregate stats
    const allBookings = await Booking.find({ isDeleted: false }).lean();
    const stats = {
      total: allBookings.length,
      draft: allBookings.filter(b => b.status === 'Draft').length,
      confirmed: allBookings.filter(b => b.status === 'Confirmed').length,
      planning: allBookings.filter(b => b.status === 'Planning').length,
      inProgress: allBookings.filter(b => b.status === 'InProgress').length,
      completed: allBookings.filter(b => b.status === 'Completed').length,
      cancelled: allBookings.filter(b => b.status === 'Cancelled').length,
      totalValue: allBookings.reduce((sum, b) => sum + (b.grandTotal || 0), 0),
      totalAdvance: allBookings.reduce((sum, b) => sum + (b.advancePaid || 0), 0),
      totalBalance: allBookings.reduce((sum, b) => sum + (b.balanceAmount || 0), 0)
    };

    res.json({
      success: true,
      data,
      stats,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ─── GET /api/bookings/:id ──────────────────────────────────────────────────
// @desc    Get single booking with populated references
const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, isDeleted: false })
      .populate('customer', 'name phone email address type gstNumber')
      .populate('quotation', 'quotationId status')
      .populate('items.item', 'name code unit rentalPrice image')
      .populate('assignedSupervisor', 'name phone')
      .populate('createdBy', 'name')
      .lean();

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    res.json({ success: true, data: booking });
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ─── POST /api/bookings ────────────────────────────────────────────────────
// @desc    Create a direct booking (without quotation conversion)
const createBooking = async (req, res) => {
  try {
    const cleanPayload = sanitizePayload(req.body);
    const bookingId = await generateBookingId();

    // Calculate totals
    const { subtotal, taxAmount, grandTotal } = calculateQuotationTotals(
      cleanPayload.items,
      cleanPayload.transportCharges || 0,
      cleanPayload.labourCharges || 0,
      cleanPayload.taxRate || 18
    );

    const advanceRequired = cleanPayload.advanceRequired || Math.round(grandTotal * 0.3);
    const advancePaid = cleanPayload.advancePaid || 0;
    const balanceAmount = Math.max(0, grandTotal - advancePaid);

    const booking = await Booking.create({
      ...cleanPayload,
      bookingId,
      subtotal,
      taxAmount,
      grandTotal,
      advanceRequired,
      advancePaid,
      balanceAmount,
      status: advancePaid > 0 ? 'Confirmed' : 'Draft',
      createdBy: req.user?._id
    });

    // Auto-create pending reservation
    await createPendingReservation(booking, req.user?._id || req.user?.id);

    const populated = await Booking.findById(booking._id)
      .populate('customer', 'name phone type')
      .lean();

    res.status(201).json({ success: true, data: populated, message: 'Booking created successfully' });
  } catch (error) {
    console.error('Error creating booking:', error);
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Duplicate booking ID. Please try again.' });
    }
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ─── PUT /api/bookings/:id ──────────────────────────────────────────────────
// @desc    Update booking details, status transition, advance payment
const updateBooking = async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, isDeleted: false });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const cleanPayload = sanitizePayload(req.body);

    // Recalculate totals if items changed
    if (cleanPayload.items) {
      const { subtotal, taxAmount, grandTotal } = calculateQuotationTotals(
        cleanPayload.items,
        cleanPayload.transportCharges ?? booking.transportCharges,
        cleanPayload.labourCharges ?? booking.labourCharges,
        cleanPayload.taxRate ?? booking.taxRate
      );
      cleanPayload.subtotal = subtotal;
      cleanPayload.taxAmount = taxAmount;
      cleanPayload.grandTotal = grandTotal;
    }

    // Recalculate balance if advance changed
    if (cleanPayload.advancePaid !== undefined) {
      const total = cleanPayload.grandTotal || booking.grandTotal;
      cleanPayload.balanceAmount = Math.max(0, total - cleanPayload.advancePaid);
    }

    Object.assign(booking, cleanPayload);
    await booking.save();

    const updated = await Booking.findById(booking._id)
      .populate('customer', 'name phone type')
      .populate('quotation', 'quotationId')
      .lean();

    res.json({ success: true, data: updated, message: 'Booking updated successfully' });
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ─── DELETE /api/bookings/:id ───────────────────────────────────────────────
// @desc    Soft delete a booking
const deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, isDeleted: false });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    booking.isDeleted = true;
    await booking.save();

    res.json({ success: true, message: 'Booking deleted successfully' });
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ─── POST /api/bookings/:id/agreement ───────────────────────────────────────
// @desc    Mark agreement as signed
const signAgreement = async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, isDeleted: false });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.agreementSigned) {
      return res.status(400).json({ success: false, message: 'Agreement is already signed' });
    }

    booking.agreementSigned = true;
    booking.agreementSignedAt = new Date();
    await booking.save();

    res.json({ success: true, data: booking, message: 'Agreement signed successfully' });
  } catch (error) {
    console.error('Error signing agreement:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  getBookings,
  getBookingById,
  createBooking,
  updateBooking,
  deleteBooking,
  signAgreement
};
