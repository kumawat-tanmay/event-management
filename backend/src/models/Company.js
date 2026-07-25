const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
  },
  phone: {
    type: String,
  },
  address: {
    type: String,
  },
  gstin: {
    type: String,
  },
  logo: {
    type: String, // Cloudinary URL
  },
  isSetupComplete: {
    type: Boolean,
    default: false,
  }
}, { timestamps: true });

const Company = mongoose.model('Company', companySchema);
module.exports = Company;
