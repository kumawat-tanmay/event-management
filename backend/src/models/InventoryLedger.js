const mongoose = require('mongoose');

const inventoryLedgerSchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  warehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: true
  },
  zoneId: { type: String },
  rackId: { type: String },
  type: {
    type: String,
    enum: [
      'OPENING_STOCK',
      'STOCK_IN',
      'STOCK_OUT',
      'RESERVED',
      'RELEASED',
      'TRANSFER_IN',
      'TRANSFER_OUT',
      'DISPATCH',
      'RETURN',
      'DAMAGED',
      'REPAIRED',
      'SCRAPPED',
      'ADJUSTMENT'
    ],
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  balanceBefore: {
    type: Number,
    required: true
  },
  balanceAfter: {
    type: Number,
    required: true
  },
  reference: {
    type: String
  },
  referenceType: {
    type: String
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId
  },
  remarks: {
    type: String
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

inventoryLedgerSchema.index({ item: 1, createdAt: -1 });
inventoryLedgerSchema.index({ warehouse: 1 });
inventoryLedgerSchema.index({ type: 1 });

const InventoryLedger = mongoose.model('InventoryLedger', inventoryLedgerSchema);
module.exports = InventoryLedger;
