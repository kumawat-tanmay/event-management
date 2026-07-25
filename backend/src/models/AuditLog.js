const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  action: {
    type: String,
    required: true,
  },
  module: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  ipAddress: {
    type: String,
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
  }
}, { timestamps: true });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
module.exports = AuditLog;
