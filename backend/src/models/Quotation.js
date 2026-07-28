const mongoose = require('mongoose');
const { lineItemSchema } = require('./shared/lineItemSchema');

// ─── Quotation Schema ───────────────────────────────────────────────────────
const quotationSchema = new mongoose.Schema({
  quotationId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: [true, 'Customer is required']
  },
  lead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead'
  },
  eventTitle: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true
  },
  eventType: {
    type: String,
    enum: ['Wedding', 'Reception', 'Corporate', 'Birthday', 'Exhibition', 'Other'],
    default: 'Wedding'
  },
  eventStartDate: {
    type: Date,
    required: [true, 'Event start date is required']
  },
  eventEndDate: {
    type: Date,
    required: [true, 'Event end date is required']
  },
  venueAddress: {
    type: String,
    required: [true, 'Venue address is required'],
    trim: true
  },
  items: {
    type: [lineItemSchema],
    validate: {
      validator: function(arr) { return arr.length > 0; },
      message: 'At least one item is required'
    }
  },
  subtotal: {
    type: Number,
    default: 0,
    min: 0
  },
  transportCharges: {
    type: Number,
    default: 0,
    min: 0
  },
  labourCharges: {
    type: Number,
    default: 0,
    min: 0
  },
  taxRate: {
    type: Number,
    default: 18,
    min: 0,
    max: 100
  },
  taxAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  grandTotal: {
    type: Number,
    default: 0,
    min: 0
  },
  termsAndConditions: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['Draft', 'Sent', 'Approved', 'Rejected', 'Converted'],
    default: 'Draft'
  },
  validUntil: {
    type: Date
  },
  notes: {
    type: String,
    trim: true
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

// Indexes
quotationSchema.index({ customer: 1 });
quotationSchema.index({ status: 1 });
quotationSchema.index({ eventStartDate: 1 });
quotationSchema.index({ isDeleted: 1, status: 1 });
quotationSchema.index({ quotationId: 'text' });

module.exports = mongoose.model('Quotation', quotationSchema);
