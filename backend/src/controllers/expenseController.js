const Expense = require('../models/Expense');
const AuditLog = require('../models/AuditLog');

// @desc    Record a new expense
// @route   POST /api/expenses
// @access  Private
exports.createExpense = async (req, res) => {
  try {
    const { category, amount, paymentMode, referenceId, refModel, notes, date } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Expense amount must be greater than 0'
      });
    }

    const expense = await Expense.create({
      category: category || 'Other',
      amount: Number(amount),
      paymentMode: paymentMode || 'Cash',
      referenceId: referenceId || undefined,
      refModel: referenceId ? (refModel || 'Other') : undefined,
      notes,
      date: date || new Date(),
      createdBy: req.user._id
    });

    // Log to AuditLog
    await AuditLog.create({
      userId: req.user._id,
      action: 'CREATE_EXPENSE',
      module: 'Finance',
      description: `Logged expense of ₹${amount} under category "${category}"`,
      details: { expenseId: expense._id, category }
    });

    res.status(201).json({
      success: true,
      data: expense,
      message: 'Expense recorded successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while recording expense'
    });
  }
};

// @desc    Get all expenses
// @route   GET /api/expenses
// @access  Private
exports.getExpenses = async (req, res) => {
  try {
    const { category, paymentMode, refModel, startDate, endDate } = req.query;
    const filter = { isDeleted: false };

    if (category) filter.category = category;
    if (paymentMode) filter.paymentMode = paymentMode;
    if (refModel) filter.refModel = refModel;

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const expenses = await Expense.find(filter)
      .populate('referenceId')
      .populate('createdBy', 'name')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      data: expenses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while fetching expenses'
    });
  }
};

// @desc    Get expense by ID
// @route   GET /api/expenses/:id
// @access  Private
exports.getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, isDeleted: false })
      .populate('referenceId')
      .populate('createdBy', 'name');

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    res.status(200).json({
      success: true,
      data: expense
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while fetching expense details'
    });
  }
};

// @desc    Delete expense (Soft Delete)
// @route   DELETE /api/expenses/:id
// @access  Private
exports.deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, isDeleted: false });
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found or already deleted'
      });
    }

    expense.isDeleted = true;
    await expense.save();

    // Log to AuditLog
    await AuditLog.create({
      userId: req.user._id,
      action: 'DELETE_EXPENSE',
      module: 'Finance',
      description: `Deleted expense of ₹${expense.amount} (Expense ID: ${expense._id})`,
      details: { expenseId: expense._id }
    });

    res.status(200).json({
      success: true,
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while deleting expense'
    });
  }
};
