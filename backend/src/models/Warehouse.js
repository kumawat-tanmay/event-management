const mongoose = require('mongoose');

// Sub-schema for individual shelves/areas inside a zone
const rackSchema = new mongoose.Schema({
  name: { type: String, required: true },       // e.g., "Rack 1A", "Floor Area B"
  capacity: String,
  description: String
});

// Sub-schema for distinct sections of the warehouse
const zoneSchema = new mongoose.Schema({
  name: { type: String, required: true },       // e.g., "Electronics Zone", "Heavy Tents"
  code: { type: String, uppercase: true },      // e.g., "Z-A"
  description: String,
  racks: {
    type: [rackSchema],
    default: []
  }
});

// Main Warehouse Schema
const warehouseSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { 
    type: String, 
    uppercase: true, 
    trim: true,
    sparse: true
  },
  location: { type: String, trim: true },
  address: { type: String, trim: true },
  phone: { type: String, trim: true },
  managerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User'
  },
  incharge: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User'
  },
  isDefault: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false },
  zones: {
    type: [zoneSchema],
    default: [],
  },                          
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

warehouseSchema.index({ isDeleted: 1, isActive: 1 });
const Warehouse = mongoose.model('Warehouse', warehouseSchema);
module.exports = Warehouse;
