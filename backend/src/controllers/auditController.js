const AuditLog = require('../models/AuditLog');

// @desc    Get all audit logs
// @route   GET /api/audit
// @access  Private
exports.getAuditLogs = async (req, res) => {
  try {
    const { userId, module, action, startDate, endDate } = req.query;
    const filter = {};

    if (userId) filter.userId = userId;
    if (module) filter.module = module;
    if (action) filter.action = action;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const logs = await AuditLog.find(filter)
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .limit(200); // Caps it to a reasonable number of latest logs

    res.status(200).json({
      success: true,
      data: logs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while fetching audit logs'
    });
  }
};
