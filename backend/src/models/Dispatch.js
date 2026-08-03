const mongoose = require('mongoose');

const dispatchSchema = new mongoose.Schema(
  {
    dispatchNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
    },
    warehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
    },
    driverName: {
      type: String,
      required: true,
      trim: true,
    },
    driverPhone: {
      type: String,
      required: true,
      trim: true,
    },
    vehicleNumber: {
      type: String,
      required: true,
      trim: true,
    },
    gatePassNumber: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['Loading', 'In-Transit', 'Delivered', 'Cancelled'],
      default: 'Loading',
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
        dispatchedQty: { type: Number, required: true, min: 1 },
      },
    ],
    dispatchedAt: {
      type: Date,
      default: Date.now,
    },
    deliveredAt: {
      type: Date,
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

dispatchSchema.index({ bookingId: 1 });
dispatchSchema.index({ warehouseId: 1 });
dispatchSchema.index({ status: 1 });

module.exports = mongoose.models.Dispatch || mongoose.model('Dispatch', dispatchSchema);
