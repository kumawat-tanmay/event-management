const mongoose = require('mongoose');

const warehouseStockSchema = new mongoose.Schema({
  warehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: true
  },
  zoneId: { type: String },
  rackId: { type: String },
  quantity: {
    type: Number,
    default: 0
  },
  dispatched: {
    type: Number,
    default: 0
  },
  damaged: {
    type: Number,
    default: 0
  }
}, { _id: false }); // Disable _id for embedded warehouse stock objects

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  unit: {
    type: String,
    default: 'Pieces'
  },
  rentalPrice: {
    type: Number,
    default: 0
  },
  purchaseCost: {
    type: Number,
    default: 0
  },
  totalStock: {
    type: Number,
    default: 0
  },
  availableStock: {
    type: Number,
    default: 0
  },
  dispatchedStock: {
    type: Number,
    default: 0
  },
  damagedStock: {
    type: Number,
    default: 0
  },
  warehouseStock: {
    type: [warehouseStockSchema],
    default: []
  },
  minStockAlert: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  image: {
    type: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

// Duplicate index removed
itemSchema.index({ isDeleted: 1, isActive: 1 });
itemSchema.index({ isDeleted: 1, createdAt: -1 }); // Performance fix for getItems aggregation sort
itemSchema.index({ name: 'text', description: 'text' });

const Item = mongoose.model('Item', itemSchema);
module.exports = Item;
