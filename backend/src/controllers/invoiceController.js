const Invoice = require('../models/Invoice');
const Booking = require('../models/Booking');
const AuditLog = require('../models/AuditLog');

// Helper to generate Invoice Number sequentially
const generateInvoiceNumber = async () => {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;
  
  // Find the last invoice with the current year prefix
  const lastInvoice = await Invoice.findOne({ invoiceNumber: new RegExp(`^${prefix}`) })
    .sort({ invoiceNumber: -1 })
    .lean();

  let nextNum = 1;
  if (lastInvoice) {
    const lastNumStr = lastInvoice.invoiceNumber.replace(prefix, '');
    const lastNum = parseInt(lastNumStr, 10);
    if (!isNaN(lastNum)) {
      nextNum = lastNum + 1;
    }
  }

  return `${prefix}${String(nextNum).padStart(4, '0')}`;
};

// @desc    Generate a tax invoice for a booking
// @route   POST /api/invoices
// @access  Private
exports.createInvoice = async (req, res) => {
  try {
    const { bookingId, discount } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID is required'
      });
    }

    // Check if invoice already exists for this booking
    let existingInvoice = await Invoice.findOne({ bookingId, isDeleted: false })
      .populate('bookingId');
    if (existingInvoice) {
      return res.status(200).json({
        success: true,
        data: existingInvoice,
        message: 'Invoice already exists'
      });
    }

    const booking = await Booking.findOne({ _id: bookingId, isDeleted: false });
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const invoiceNumber = await generateInvoiceNumber();

    // Calculate CGST and SGST (split of GST amount)
    const taxAmt = booking.taxAmount || 0;
    const cgstAmount = Number((taxAmt / 2).toFixed(2));
    const sgstAmount = Number((taxAmt / 2).toFixed(2));

    // Calculate invoice totals
    const finalDiscount = Number(discount || 0);
    const totalAmount = Math.max(0, booking.grandTotal - finalDiscount);

    // If balanceAmount is 0, the invoice is fully Paid.
    const status = booking.balanceAmount === 0 ? 'Paid' : 'Unpaid';

    const invoice = await Invoice.create({
      invoiceNumber,
      bookingId,
      date: new Date(),
      subtotal: booking.subtotal || 0,
      gstRate: booking.taxRate || 18,
      cgstAmount,
      sgstAmount,
      igstAmount: 0, // regional CGST + SGST by default
      discount: finalDiscount,
      totalAmount,
      status,
      createdBy: req.user._id
    });

    // Log to AuditLog
    await AuditLog.create({
      userId: req.user._id,
      action: 'CREATE_INVOICE',
      module: 'Finance',
      description: `Generated tax invoice ${invoiceNumber} for Booking ${booking.bookingId}`,
      details: { invoiceId: invoice._id, bookingId }
    });

    // Populated response
    const populatedInvoice = await Invoice.findById(invoice._id).populate('bookingId');

    res.status(201).json({
      success: true,
      data: populatedInvoice,
      message: 'Invoice generated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while generating invoice'
    });
  }
};

// @desc    Get all invoices
// @route   GET /api/invoices
// @access  Private
exports.getInvoices = async (req, res) => {
  try {
    const { status, bookingId } = req.query;
    const filter = { isDeleted: false };

    if (status) filter.status = status;
    if (bookingId) filter.bookingId = bookingId;

    const invoices = await Invoice.find(filter)
      .populate({
        path: 'bookingId',
        select: 'bookingId eventTitle customer eventStartDate grandTotal balanceAmount',
        populate: {
          path: 'customer',
          select: 'name phone email address gstNumber'
        }
      })
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: invoices
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while fetching invoices'
    });
  }
};

// @desc    Get invoice by ID
// @route   GET /api/invoices/:id
// @access  Private
exports.getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, isDeleted: false })
      .populate({
        path: 'bookingId',
        populate: [
          { path: 'customer', select: 'name phone email address gstNumber' },
          { path: 'assignedSupervisor', select: 'name' }
        ]
      })
      .populate('createdBy', 'name');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    res.status(200).json({
      success: true,
      data: invoice
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while fetching invoice details'
    });
  }
};

// @desc    Delete invoice (Soft Delete)
// @route   DELETE /api/invoices/:id
// @access  Private
exports.deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, isDeleted: false });
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found or already deleted'
      });
    }

    invoice.isDeleted = true;
    invoice.status = 'Cancelled';
    await invoice.save();

    // Log to AuditLog
    await AuditLog.create({
      userId: req.user._id,
      action: 'DELETE_INVOICE',
      module: 'Finance',
      description: `Deleted invoice ${invoice.invoiceNumber}`,
      details: { invoiceId: invoice._id }
    });

    res.status(200).json({
      success: true,
      message: 'Invoice deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while deleting invoice'
    });
  }
};
