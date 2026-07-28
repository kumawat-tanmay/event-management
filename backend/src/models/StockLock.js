const mongoose = require('mongoose');

const stockLockSchema = new mongoose.Schema(
  {
    warehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
    },
    reservationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reservation',
      required: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
    },
    lockedQty: {
      type: Number,
      required: true,
      min: [1, 'Must lock at least 1 item'],
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    lockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isReleased: {
      type: Boolean,
      default: false,
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

// High concurrency indexes for calculating live overlap available stock
stockLockSchema.index({ itemId: 1, warehouseId: 1, startDate: 1, endDate: 1, isReleased: 1, isDeleted: 1 });

module.exports = mongoose.models.StockLock || mongoose.model('StockLock', stockLockSchema);
