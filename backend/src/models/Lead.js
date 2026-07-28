const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  leadId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  customerName: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  eventType: {
    type: String,
    required: [true, 'Event type is required'],
    trim: true
  },
  eventDate: {
    type: Date
  },
  source: {
    type: String,
    enum: ['Instagram', 'Reference', 'Website', 'Walk-in', 'Call', 'Other'],
    default: 'Walk-in'
  },
  stage: {
    type: String,
    enum: ['New', 'Contacted', 'Site Visit', 'Quotation', 'Booked', 'Lost'],
    default: 'New'
  },
  assignedStaff: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: {
    type: String,
    trim: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

leadSchema.index({ customerName: 'text', phone: 'text' });

module.exports = mongoose.model('Lead', leadSchema);
