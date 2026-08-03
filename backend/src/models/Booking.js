const mongoose = require('mongoose');
const { lineItemSchema } = require('./shared/lineItemSchema');

// ─── Booking Schema ─────────────────────────────────────────────────────────
const bookingSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  quotation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quotation'
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: [true, 'Customer is required']
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
  discount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
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
  advanceRequired: {
    type: Number,
    default: 0,
    min: 0
  },
  advancePaid: {
    type: Number,
    default: 0,
    min: 0
  },
  balanceAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  assignedSupervisor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['Draft', 'Confirmed', 'Stock Locked', 'Planning', 'InProgress', 'Completed', 'Cancelled'],
    default: 'Draft'
  },
  agreementSigned: {
    type: Boolean,
    default: false
  },
  agreementSignedAt: {
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
bookingSchema.index({ customer: 1 });
bookingSchema.index({ quotation: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ eventStartDate: 1 });
bookingSchema.index({ isDeleted: 1, status: 1 });
bookingSchema.index({ bookingId: 'text' });

module.exports = mongoose.model('Booking', bookingSchema);
