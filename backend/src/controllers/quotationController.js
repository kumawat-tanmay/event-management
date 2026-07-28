const Quotation = require('../models/Quotation');
const Lead = require('../models/Lead');
const { generateQuotationId, calculateQuotationTotals } = require('../services/quotationService');
const { checkMultiWarehouseAvailability } = require('../services/stockService');
const { convertQuotationToBooking } = require('../services/bookingService');

// Helper to sanitize empty ObjectId fields
const sanitizePayload = (body) => {
  const payload = { ...body };
  if (payload.customer === '' || payload.customer === null) delete payload.customer;
  if (payload.lead === '' || payload.lead === null) delete payload.lead;
  if (payload.assignedSupervisor === '' || payload.assignedSupervisor === null) delete payload.assignedSupervisor;
  return payload;
};

// ─── GET /api/quotations ─────────────────────────────────────────────────────
// @desc    List quotations with pagination, search, status & date filter
const getQuotations = async (req, res) => {
  try {
    const { search, status, startDate, endDate, page = 1, limit = 50 } = req.query;
    const query = { isDeleted: false };

    if (status && status !== 'All') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { quotationId: { $regex: search, $options: 'i' } },
        { eventTitle: { $regex: search, $options: 'i' } }
      ];
    }

    if (startDate || endDate) {
      query.eventStartDate = {};
      if (startDate) query.eventStartDate.$gte = new Date(startDate);
      if (endDate) query.eventStartDate.$lte = new Date(endDate);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Quotation.countDocuments(query);
    const data = await Quotation.find(query)
      .populate('customer', 'name phone type')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    // Aggregate stats
    const allQuotations = await Quotation.find({ isDeleted: false }).lean();
    const stats = {
      total: allQuotations.length,
      draft: allQuotations.filter(q => q.status === 'Draft').length,
      sent: allQuotations.filter(q => q.status === 'Sent').length,
      approved: allQuotations.filter(q => q.status === 'Approved').length,
      converted: allQuotations.filter(q => q.status === 'Converted').length,
      rejected: allQuotations.filter(q => q.status === 'Rejected').length,
      totalValue: allQuotations.reduce((sum, q) => sum + (q.grandTotal || 0), 0)
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
    console.error('Error fetching quotations:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ─── GET /api/quotations/:id ────────────────────────────────────────────────
// @desc    Get single quotation with populated references
const getQuotationById = async (req, res) => {
  try {
    const quotation = await Quotation.findOne({ _id: req.params.id, isDeleted: false })
      .populate('customer', 'name phone email address type gstNumber')
      .populate('lead', 'leadId customerName eventType')
      .populate('items.item', 'name code unit rentalPrice image')
      .populate('createdBy', 'name')
      .lean();

    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    res.json({ success: true, data: quotation });
  } catch (error) {
    console.error('Error fetching quotation:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ─── POST /api/quotations ───────────────────────────────────────────────────
// @desc    Create a new quotation with auto-generated ID and computed totals
const createQuotation = async (req, res) => {
  try {
    const cleanPayload = sanitizePayload(req.body);
    const quotationId = await generateQuotationId();

    // Calculate totals
    const { subtotal, taxAmount, grandTotal } = calculateQuotationTotals(
      cleanPayload.items,
      cleanPayload.transportCharges || 0,
      cleanPayload.labourCharges || 0,
      cleanPayload.taxRate || 18
    );

    const quotation = await Quotation.create({
      ...cleanPayload,
      quotationId,
      subtotal,
      taxAmount,
      grandTotal,
      createdBy: req.user?._id
    });

    // Auto-update linked Lead stage to 'Quotation'
    if (cleanPayload.lead) {
      await Lead.findByIdAndUpdate(cleanPayload.lead, { stage: 'Quotation' });
    }

    const populated = await Quotation.findById(quotation._id)
      .populate('customer', 'name phone type')
      .lean();

    res.status(201).json({ success: true, data: populated, message: 'Quotation created successfully' });
  } catch (error) {
    console.error('Error creating quotation:', error);
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Duplicate quotation ID. Please try again.' });
    }
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ─── PUT /api/quotations/:id ────────────────────────────────────────────────
// @desc    Update a quotation (only Draft/Sent status allowed)
const updateQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findOne({ _id: req.params.id, isDeleted: false });

    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    if (['Converted'].includes(quotation.status)) {
      return res.status(400).json({ success: false, message: 'Cannot edit a converted quotation' });
    }

    const cleanPayload = sanitizePayload(req.body);

    // Recalculate totals if items changed
    if (cleanPayload.items) {
      const { subtotal, taxAmount, grandTotal } = calculateQuotationTotals(
        cleanPayload.items,
        cleanPayload.transportCharges ?? quotation.transportCharges,
        cleanPayload.labourCharges ?? quotation.labourCharges,
        cleanPayload.taxRate ?? quotation.taxRate
      );
      cleanPayload.subtotal = subtotal;
      cleanPayload.taxAmount = taxAmount;
      cleanPayload.grandTotal = grandTotal;
    }

    Object.assign(quotation, cleanPayload);
    await quotation.save();

    const updated = await Quotation.findById(quotation._id)
      .populate('customer', 'name phone type')
      .lean();

    res.json({ success: true, data: updated, message: 'Quotation updated successfully' });
  } catch (error) {
    console.error('Error updating quotation:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ─── DELETE /api/quotations/:id ─────────────────────────────────────────────
// @desc    Soft delete a quotation
const deleteQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findOne({ _id: req.params.id, isDeleted: false });

    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    quotation.isDeleted = true;
    await quotation.save();

    res.json({ success: true, message: 'Quotation deleted successfully' });
  } catch (error) {
    console.error('Error deleting quotation:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ─── POST /api/quotations/check-stock ───────────────────────────────────────
// @desc    Check live stock availability across all warehouses
const checkStock = async (req, res) => {
  try {
    const { items, eventStartDate, eventEndDate, excludeBookingId } = req.body;
    const availability = await checkMultiWarehouseAvailability(
      items,
      new Date(eventStartDate),
      new Date(eventEndDate),
      excludeBookingId
    );

    const allAvailable = availability.every(a => a.isFullyAvailable);

    res.json({
      success: true,
      data: availability,
      allAvailable,
      message: allAvailable
        ? 'All items are available'
        : 'Some items have insufficient stock'
    });
  } catch (error) {
    console.error('Error checking stock:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ─── POST /api/quotations/:id/convert-booking ───────────────────────────────
// @desc    Convert an approved quotation to a booking
const convertToBooking = async (req, res) => {
  try {
    const booking = await convertQuotationToBooking(req.params.id, req.user?._id);

    res.status(201).json({
      success: true,
      data: booking,
      message: 'Quotation converted to booking successfully'
    });
  } catch (error) {
    console.error('Error converting quotation:', error);
    if (error.message.includes('not found') || error.message.includes('already converted') || error.message.includes('rejected')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  getQuotations,
  getQuotationById,
  createQuotation,
  updateQuotation,
  deleteQuotation,
  checkStock,
  convertToBooking
};
