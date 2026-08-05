const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: ['Transport', 'Material Purchase', 'Maintenance', 'Staff Salary', 'Other'],
    default: 'Other'
  },
  amount: {
    type: Number,
    required: [true, 'Expense amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  paymentMode: {
    type: String,
    enum: ['Cash', 'UPI', 'Bank Transfer', 'Cheque'],
    default: 'Cash'
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'refModel'
  },
  refModel: {
    type: String,
    enum: ['Staff', 'Booking', 'Vendor', 'Vehicle']
  },
  notes: {
    type: String,
    trim: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

expenseSchema.index({ category: 1 });
expenseSchema.index({ date: 1 });
expenseSchema.index({ referenceId: 1 });

module.exports = mongoose.model('Expense', expenseSchema);
