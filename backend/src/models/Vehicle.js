const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  vehicleId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  plateNumber: { type: String, required: true, unique: true },
  type: { 
    type: String, 
    enum: ['Pickup 407', 'Tata Ace', 'Heavy Truck', 'Bolero', 'Van', 'Tractor', 'Other'],
    default: 'Pickup 407' 
  },
  capacity: { type: String, default: '1.5 Tons' },
  assignedDriverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', default: null },
  status: { type: String, enum: ['available', 'on_dispatch', 'maintenance'], default: 'available' },
  ownership: { type: String, enum: ['company', 'rented'], default: 'company' },
  isDeleted: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' }
}, { timestamps: true });

vehicleSchema.index({ isDeleted: 1, status: 1 });
vehicleSchema.index({ isDeleted: 1, type: 1 });
vehicleSchema.index({ name: 'text', plateNumber: 'text', vehicleId: 'text' });

module.exports = mongoose.model('Vehicle', vehicleSchema);
