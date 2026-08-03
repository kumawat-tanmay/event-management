const mongoose = require('mongoose');

const returnItemSchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true,
  },
  name: { type: String, required: true },
  code: { type: String, default: '' },
  requestedQty: { type: Number, default: 0 },
  dispatchedQty: { type: Number, default: 0 },
  returnedGoodQty: { type: Number, default: 0 },
  returnedDamagedQty: { type: Number, default: 0 },
  missingQty: { type: Number, default: 0 },
});

const eventExecutionSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      index: true,
    },
    dispatchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Dispatch',
    },
    type: {
      type: String,
      enum: ['SiteReceipt', 'Verification', 'Return'],
      required: true,
    },
    status: {
      type: String,
      enum: ['Draft', 'Submitted', 'Verified', 'Settled'],
      default: 'Submitted',
    },
    materialCondition: {
      type: String,
      enum: ['OK', 'Damaged', 'Shortage'],
      default: 'OK',
    },
    remarks: {
      type: String,
      trim: true,
      default: '',
    },
    supervisorName: {
      type: String,
      trim: true,
      default: '',
    },
    photos: [{
      type: String,
    }],
    returnItems: [returnItemSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('EventExecution', eventExecutionSchema);
