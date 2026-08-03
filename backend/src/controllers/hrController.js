const hrService = require('../services/hrService');

// ─── Staff Handlers ─────────────────────────────────────────────────────────

/**
 * @desc    Get all staff records with search & filter
 * @route   GET /api/hr/staff
 * @access  Private (hr.view)
 */
exports.getStaff = async (req, res) => {
  try {
    const { search, role, status, page, limit } = req.query;
    const result = await hrService.getStaff({ search, role, status, page, limit });
    
    // Support array response for legacy frontend compatibility or wrapped data
    res.json({ success: true, data: result.data, total: result.total });
  } catch (error) {
    console.error('Error in getStaff:', error);
    res.status(500).json({ success: false, message: error.message || 'Server Error' });
  }
};

/**
 * @desc    Get single staff member by ID
 * @route   GET /api/hr/staff/:id
 * @access  Private (hr.view)
 */
exports.getStaffById = async (req, res) => {
  try {
    const staff = await hrService.getStaffById(req.params.id);
    res.json({ success: true, data: staff });
  } catch (error) {
    console.error('Error in getStaffById:', error);
    res.status(404).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Create a new staff member
 * @route   POST /api/hr/staff
 * @access  Private (hr.create)
 */
exports.createStaff = async (req, res) => {
  try {
    const staff = await hrService.createStaff(req.body, req.user?._id);
    res.status(201).json({ success: true, data: staff });
  } catch (error) {
    console.error('Error in createStaff:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update staff member details
 * @route   PUT /api/hr/staff/:id
 * @access  Private (hr.update)
 */
exports.updateStaff = async (req, res) => {
  try {
    const staff = await hrService.updateStaff(req.params.id, req.body);
    res.json({ success: true, data: staff });
  } catch (error) {
    console.error('Error in updateStaff:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Soft delete staff member
 * @route   DELETE /api/hr/staff/:id
 * @access  Private (hr.delete)
 */
exports.deleteStaff = async (req, res) => {
  try {
    await hrService.deleteStaff(req.params.id);
    res.json({ success: true, message: 'Staff member deleted successfully' });
  } catch (error) {
    console.error('Error in deleteStaff:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Log salary / advance payment for staff
 * @route   POST /api/hr/staff/:id/pay
 * @access  Private (hr.update)
 */
exports.logStaffPayment = async (req, res) => {
  try {
    const staff = await hrService.logPayment(req.params.id, req.body, req.user?._id);
    res.json({ success: true, data: staff });
  } catch (error) {
    console.error('Error in logStaffPayment:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─── Vehicle Handlers ───────────────────────────────────────────────────────

/**
 * @desc    Get all vehicles in fleet
 * @route   GET /api/hr/vehicles
 * @access  Private (hr.view)
 */
exports.getVehicles = async (req, res) => {
  try {
    const { search, status, type, page, limit } = req.query;
    const result = await hrService.getVehicles({ search, status, type, page, limit });
    
    // Support array response for legacy frontend compatibility or wrapped data
    res.json({ success: true, data: result.data, total: result.total });
  } catch (error) {
    console.error('Error in getVehicles:', error);
    res.status(500).json({ success: false, message: error.message || 'Server Error' });
  }
};

/**
 * @desc    Get single vehicle by ID
 * @route   GET /api/hr/vehicles/:id
 * @access  Private (hr.view)
 */
exports.getVehicleById = async (req, res) => {
  try {
    const vehicle = await hrService.getVehicleById(req.params.id);
    res.json({ success: true, data: vehicle });
  } catch (error) {
    console.error('Error in getVehicleById:', error);
    res.status(404).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Register a new vehicle in fleet
 * @route   POST /api/hr/vehicles
 * @access  Private (hr.create)
 */
exports.createVehicle = async (req, res) => {
  try {
    const vehicle = await hrService.createVehicle(req.body, req.user?._id);
    res.status(201).json({ success: true, data: vehicle });
  } catch (error) {
    console.error('Error in createVehicle:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update vehicle details
 * @route   PUT /api/hr/vehicles/:id
 * @access  Private (hr.update)
 */
exports.updateVehicle = async (req, res) => {
  try {
    const vehicle = await hrService.updateVehicle(req.params.id, req.body);
    res.json({ success: true, data: vehicle });
  } catch (error) {
    console.error('Error in updateVehicle:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Soft delete vehicle from fleet
 * @route   DELETE /api/hr/vehicles/:id
 * @access  Private (hr.delete)
 */
exports.deleteVehicle = async (req, res) => {
  try {
    await hrService.deleteVehicle(req.params.id);
    res.json({ success: true, message: 'Vehicle deleted successfully' });
  } catch (error) {
    console.error('Error in deleteVehicle:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
