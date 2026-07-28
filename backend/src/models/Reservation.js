const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
    },
    quotationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quotation',
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Auto-Split', 'Locked', 'Partially Released', 'Released'],
      default: 'Pending',
    },
    items: [
      {
        item: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Item',
          required: true,
        },
        name: { type: String, required: true },
        code: { type: String, required: true },
        requestedQty: { type: Number, required: true },
        lockedQty: { type: Number, default: 0 },
        isFullyLocked: { type: Boolean, default: false },
      },
    ],
    eventStartDate: {
      type: Date,
      required: true,
    },
    eventEndDate: {
      type: Date,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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

// Indexes for faster querying
reservationSchema.index({ bookingId: 1 });
reservationSchema.index({ eventStartDate: 1, eventEndDate: 1 });
reservationSchema.index({ status: 1 });

module.exports = mongoose.models.Reservation || mongoose.model('Reservation', reservationSchema);
