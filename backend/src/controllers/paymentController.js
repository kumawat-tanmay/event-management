const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const AuditLog = require('../models/AuditLog');

// @desc    Record a new payment
// @route   POST /api/payments
// @access  Private
exports.createPayment = async (req, res) => {
  try {
    const { bookingId, customerId, amount, paymentType, paymentMode, transactionId, transactionDate, notes } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount must be greater than 0'
      });
    }

    let finalCustomerId = customerId;
    let bookingRef = null;

    if (bookingId) {
      bookingRef = await Booking.findById(bookingId);
      if (!bookingRef) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }
      finalCustomerId = bookingRef.customer;

      // Adjust Booking fields for rental payments
      if (paymentType === 'refund') {
        bookingRef.advancePaid = Math.max(0, (bookingRef.advancePaid || 0) - Number(amount));
        bookingRef.balanceAmount = Math.max(0, bookingRef.grandTotal - bookingRef.advancePaid);
        await bookingRef.save();
      } else if (paymentType === 'advance' || paymentType === 'final') {
        bookingRef.advancePaid = (bookingRef.advancePaid || 0) + Number(amount);
        bookingRef.balanceAmount = Math.max(0, bookingRef.grandTotal - bookingRef.advancePaid);
        await bookingRef.save();
      }
      // Note: security_deposit and security_refund are held as refundable liabilities and do not alter rental advancePaid towards grandTotal.
    }

    const modePrefix = (paymentMode || 'Cash').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4) || 'TXN';
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const autoTxnId = `${modePrefix}-${dateStr}-${randomCode}`;
    const finalTransactionId = (transactionId && typeof transactionId === 'string' && transactionId.trim()) 
      ? transactionId.trim() 
      : autoTxnId;

    const payment = await Payment.create({
      bookingId: bookingId || undefined,
      customerId: finalCustomerId || undefined,
      amount: Number(amount),
      paymentType: paymentType || 'advance',
      paymentMode: paymentMode || 'Cash',
      transactionId: finalTransactionId,
      transactionDate: transactionDate || new Date(),
      notes,
      createdBy: req.user._id
    });

    // Log to AuditLog
    await AuditLog.create({
      userId: req.user._id,
      action: 'CREATE_PAYMENT',
      module: 'Finance',
      description: `Recorded payment of ₹${amount} (${paymentMode}) for ${bookingRef ? `Booking ${bookingRef.bookingId}` : 'General Customer'}`,
      details: { paymentId: payment._id, bookingId }
    });

    res.status(201).json({
      success: true,
      data: payment,
      message: 'Payment recorded successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while recording payment'
    });
  }
};

// @desc    Get all payments
// @route   GET /api/payments
// @access  Private
exports.getPayments = async (req, res) => {
  try {
    const { bookingId, customerId, paymentType, paymentMode, startDate, endDate } = req.query;
    const filter = { isDeleted: false };

    if (bookingId) filter.bookingId = bookingId;
    if (customerId) filter.customerId = customerId;
    if (paymentType) filter.paymentType = paymentType;
    if (paymentMode) filter.paymentMode = paymentMode;

    if (startDate || endDate) {
      filter.transactionDate = {};
      if (startDate) filter.transactionDate.$gte = new Date(startDate);
      if (endDate) filter.transactionDate.$lte = new Date(endDate);
    }

    const payments = await Payment.find(filter)
      .populate('bookingId', 'bookingId eventTitle')
      .populate('customerId', 'name phone')
      .populate('createdBy', 'name')
      .sort({ transactionDate: -1 });

    res.status(200).json({
      success: true,
      data: payments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while fetching payments'
    });
  }
};

// @desc    Get payment by ID
// @route   GET /api/payments/:id
// @access  Private
exports.getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findOne({ _id: req.params.id, isDeleted: false })
      .populate('bookingId', 'bookingId eventTitle grandTotal advancePaid balanceAmount')
      .populate('customerId', 'name phone email address')
      .populate('createdBy', 'name');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.status(200).json({
      success: true,
      data: payment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while fetching payment details'
    });
  }
};

// @desc    Delete payment (Soft Delete)
// @route   DELETE /api/payments/:id
// @access  Private
exports.deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findOne({ _id: req.params.id, isDeleted: false });
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found or already deleted'
      });
    }

    payment.isDeleted = true;
    await payment.save();

    // Revert Booking updates
    if (payment.bookingId) {
      const bookingRef = await Booking.findById(payment.bookingId);
      if (bookingRef) {
        if (payment.paymentType === 'refund') {
          bookingRef.advancePaid = (bookingRef.advancePaid || 0) + payment.amount;
        } else {
          bookingRef.advancePaid = Math.max(0, (bookingRef.advancePaid || 0) - payment.amount);
        }
        bookingRef.balanceAmount = Math.max(0, bookingRef.grandTotal - bookingRef.advancePaid);
        await bookingRef.save();
      }
    }

    // Log to AuditLog
    await AuditLog.create({
      userId: req.user._id,
      action: 'DELETE_PAYMENT',
      module: 'Finance',
      description: `Deleted payment of ₹${payment.amount} (Payment ID: ${payment._id})`,
      details: { paymentId: payment._id }
    });

    res.status(200).json({
      success: true,
      message: 'Payment deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while deleting payment'
    });
  }
};
