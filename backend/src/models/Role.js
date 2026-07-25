const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  permissions: {
    type: [String],
    default: [],
  },
  isSystem: {
    type: Boolean,
    default: false, // true for default roles like Owner, Admin
  },
  isDeleted: {
    type: Boolean,
    default: false,
  }
}, { timestamps: true });

const Role = mongoose.model('Role', roleSchema);
module.exports = Role;
