const Payment = require('../models/Payment');
const Expense = require('../models/Expense');
const Booking = require('../models/Booking');

// @desc    Get Cashbook entries & balance
// @route   GET /api/finance/cashbook
// @access  Private
exports.getCashbook = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const queryFilter = { isDeleted: false, paymentMode: 'Cash' };
    if (startDate || endDate) {
      queryFilter.dateFilter = {};
      if (startDate) queryFilter.dateFilter.$gte = new Date(startDate);
      if (endDate) queryFilter.dateFilter.$lte = new Date(endDate);
    }

    // Fetch cash payments
    const paymentsFilter = { ...queryFilter };
    if (paymentsFilter.dateFilter) {
      paymentsFilter.transactionDate = paymentsFilter.dateFilter;
      delete paymentsFilter.dateFilter;
    }
    const payments = await Payment.find(paymentsFilter)
      .populate('bookingId', 'bookingId eventTitle')
      .populate('customerId', 'name');

    // Fetch cash expenses
    const expensesFilter = { ...queryFilter };
    if (expensesFilter.dateFilter) {
      expensesFilter.date = expensesFilter.dateFilter;
      delete expensesFilter.dateFilter;
    }
    const expenses = await Expense.find(expensesFilter);

    // Combine and sort chronologically
    let ledger = [];

    payments.forEach(p => {
      ledger.push({
        _id: p._id,
        type: 'receipt', // Cash In
        source: p.paymentType === 'refund' ? 'Booking Refund' : 'Customer Payment',
        reference: p.bookingId ? p.bookingId.bookingId : 'General Customer',
        details: p.bookingId ? p.bookingId.eventTitle : (p.customerId ? p.customerId.name : ''),
        amount: p.amount,
        date: p.transactionDate,
        notes: p.notes
      });
    });

    expenses.forEach(e => {
      ledger.push({
        _id: e._id,
        type: 'payment', // Cash Out
        source: `Expense - ${e.category}`,
        reference: e.refModel || 'Operational',
        details: e.notes || '',
        amount: e.amount,
        date: e.date,
        notes: e.notes
      });
    });

    // Sort by date ascending to calculate running balance
    ledger.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate opening/running balances
    let runningBalance = 0;
    const ledgerWithBalances = ledger.map(item => {
      if (item.type === 'receipt') {
        if (item.source === 'Booking Refund') {
          runningBalance -= item.amount; // Refund goes out
        } else {
          runningBalance += item.amount;
        }
      } else {
        runningBalance -= item.amount;
      }
      return { ...item, runningBalance };
    });

    // If date filters applied, we filter ledger after sorting to maintain correct running balance context,
    // or simply return the slice. Let's return the sorted ledger and summary.
    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalCashIn: payments.reduce((acc, curr) => acc + (curr.paymentType === 'refund' ? 0 : curr.amount), 0),
          totalCashOut: expenses.reduce((acc, curr) => acc + curr.amount, 0) + payments.reduce((acc, curr) => acc + (curr.paymentType === 'refund' ? curr.amount : 0), 0),
          currentBalance: runningBalance
        },
        ledger: ledgerWithBalances.reverse() // Sort descending for UI tables
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while fetching cashbook'
    });
  }
};

// @desc    Get Bankbook entries & balance
// @route   GET /api/finance/bankbook
// @access  Private
exports.getBankbook = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const bankModes = ['UPI', 'Bank Transfer', 'Cheque'];
    const queryFilter = { isDeleted: false, paymentMode: { $in: bankModes } };

    // Fetch bank payments
    const paymentsFilter = { ...queryFilter };
    if (startDate || endDate) {
      paymentsFilter.transactionDate = {};
      if (startDate) paymentsFilter.transactionDate.$gte = new Date(startDate);
      if (endDate) paymentsFilter.transactionDate.$lte = new Date(endDate);
    }
    const payments = await Payment.find(paymentsFilter)
      .populate('bookingId', 'bookingId eventTitle')
      .populate('customerId', 'name');

    // Fetch bank expenses
    const expensesFilter = { ...queryFilter };
    if (startDate || endDate) {
      expensesFilter.date = {};
      if (startDate) expensesFilter.date.$gte = new Date(startDate);
      if (endDate) expensesFilter.date.$lte = new Date(endDate);
    }
    const expenses = await Expense.find(expensesFilter);

    // Combine and sort
    let ledger = [];

    payments.forEach(p => {
      ledger.push({
        _id: p._id,
        type: 'receipt',
        source: p.paymentType === 'refund' ? 'Booking Refund' : 'Customer Payment',
        mode: p.paymentMode,
        reference: p.bookingId ? p.bookingId.bookingId : 'General Customer',
        details: p.bookingId ? p.bookingId.eventTitle : (p.customerId ? p.customerId.name : ''),
        transactionId: p.transactionId,
        amount: p.amount,
        date: p.transactionDate,
        notes: p.notes
      });
    });

    expenses.forEach(e => {
      ledger.push({
        _id: e._id,
        type: 'payment',
        source: `Expense - ${e.category}`,
        mode: e.paymentMode,
        reference: e.refModel || 'Operational',
        details: e.notes || '',
        transactionId: '',
        amount: e.amount,
        date: e.date,
        notes: e.notes
      });
    });

    ledger.sort((a, b) => new Date(a.date) - new Date(b.date));

    let runningBalance = 0;
    const ledgerWithBalances = ledger.map(item => {
      if (item.type === 'receipt') {
        if (item.source === 'Booking Refund') {
          runningBalance -= item.amount;
        } else {
          runningBalance += item.amount;
        }
      } else {
        runningBalance -= item.amount;
      }
      return { ...item, runningBalance };
    });

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalBankIn: payments.reduce((acc, curr) => acc + (curr.paymentType === 'refund' ? 0 : curr.amount), 0),
          totalBankOut: expenses.reduce((acc, curr) => acc + curr.amount, 0) + payments.reduce((acc, curr) => acc + (curr.paymentType === 'refund' ? curr.amount : 0), 0),
          currentBalance: runningBalance
        },
        ledger: ledgerWithBalances.reverse()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while fetching bankbook'
    });
  }
};

// @desc    Get Event Profit & Loss / General Company P&L
// @route   GET /api/finance/profit-loss
// @access  Private
exports.getProfitLoss = async (req, res) => {
  try {
    const { bookingId } = req.query;

    if (bookingId) {
      // Event-wise P&L
      const booking = await Booking.findById(bookingId).populate('customer', 'name');
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      // Sum event payments received
      const payments = await Payment.find({ bookingId, isDeleted: false });
      const totalPaymentsReceived = payments.reduce((acc, curr) => {
        if (curr.paymentType === 'refund') return acc - curr.amount;
        return acc + curr.amount;
      }, 0);

      // Sum event expenses
      const expenses = await Expense.find({ referenceId: bookingId, refModel: 'Booking', isDeleted: false });
      const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);

      const netProfit = totalPaymentsReceived - totalExpenses;
      const profitMargin = totalPaymentsReceived > 0 ? ((netProfit / totalPaymentsReceived) * 100).toFixed(2) : 0;

      return res.status(200).json({
        success: true,
        data: {
          eventTitle: booking.eventTitle,
          bookingId: booking.bookingId,
          grandTotal: booking.grandTotal,
          totalPaymentsReceived,
          totalExpenses,
          netProfit,
          profitMargin,
          expensesList: expenses
        }
      });
    }

    // General Company-wide P&L
    const allPayments = await Payment.find({ isDeleted: false });
    const allExpenses = await Expense.find({ isDeleted: false });

    const totalRevenue = allPayments.reduce((acc, curr) => {
      if (curr.paymentType === 'refund') return acc - curr.amount;
      if (curr.paymentType === 'vendor_payment') return acc; // vendor payment is cash out / expense
      return acc + curr.amount;
    }, 0);

    const totalOperationalExpenses = allExpenses.reduce((acc, curr) => acc + curr.amount, 0);
    const totalVendorPayments = allPayments.reduce((acc, curr) => {
      if (curr.paymentType === 'vendor_payment') return acc + curr.amount;
      return acc;
    }, 0);

    const totalOutflow = totalOperationalExpenses + totalVendorPayments;
    const netCompanyProfit = totalRevenue - totalOutflow;

    res.status(200).json({
      success: true,
      data: {
        totalRevenue,
        totalOperationalExpenses,
        totalVendorPayments,
        totalOutflow,
        netCompanyProfit,
        profitMargin: totalRevenue > 0 ? ((netCompanyProfit / totalRevenue) * 100).toFixed(2) : 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while calculating profit & loss'
    });
  }
};
