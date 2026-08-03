const mongoose = require('mongoose');

const paymentHistorySchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['Salary', 'Advance', 'Allowance', 'Bonus'], default: 'Salary' },
  mode: { type: String, enum: ['Cash', 'UPI', 'Bank Transfer', 'Cheque'], default: 'Cash' },
  notes: { type: String, default: '' },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

const staffSchema = new mongoose.Schema({
  staffId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, default: '' },
  role: { 
    type: String, 
    enum: ['Owner', 'Admin', 'Manager', 'Store Manager', 'Godown Manager', 'Driver', 'Supervisor', 'Event Supervisor', 'Labour', 'Accountant', 'Other'],
    default: 'Labour' 
  },
  joinedDate: { type: Date, default: Date.now },
  compensationType: { type: String, enum: ['daily', 'monthly'], default: 'daily' },
  basePay: { type: Number, default: 0 },
  totalPaid: { type: Number, default: 0 },
  pendingDues: { type: Number, default: 0 },
  status: { type: String, enum: ['Active', 'Inactive', 'On Leave'], default: 'Active' },
  paymentHistory: [paymentHistorySchema],
  isDeleted: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' }
}, { timestamps: true });

staffSchema.index({ isDeleted: 1, status: 1 });
staffSchema.index({ isDeleted: 1, role: 1 });
staffSchema.index({ name: 'text', phone: 'text', staffId: 'text' });

module.exports = mongoose.model('Staff', staffSchema);
