const mongoose = require('mongoose');

const warehouseTransferSchema = new mongoose.Schema(
  {
    transferNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    fromWarehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
    },
    toWarehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
    },
    status: {
      type: String,
      enum: ['Requested', 'Approved', 'In-Transit', 'Received', 'Rejected'],
      default: 'Requested',
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
        quantity: { type: Number, required: true, min: 1 },
      },
    ],
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    transferDate: {
      type: Date,
      default: Date.now,
    },
    receivedAt: {
      type: Date,
    },
    remarks: {
      type: String,
      trim: true,
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

warehouseTransferSchema.index({ fromWarehouse: 1, toWarehouse: 1 });
warehouseTransferSchema.index({ status: 1 });

module.exports = mongoose.models.WarehouseTransfer || mongoose.model('WarehouseTransfer', warehouseTransferSchema);
