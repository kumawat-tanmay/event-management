const mongoose = require('mongoose');

/**
 * Shared line-item sub-schema used by both Quotation and Booking models.
 * Represents a denormalized snapshot of an inventory item at the time of creation.
 * Each model stores its own copy so changes to one do not affect the other.
 */
const lineItemSchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: false
  },
  itemName: {
    type: String,
    required: true,
    trim: true
  },
  itemCode: {
    type: String,
    trim: true,
    uppercase: true
  },
  unit: {
    type: String,
    default: 'Pieces'
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  }
}, { _id: false });

module.exports = { lineItemSchema };
