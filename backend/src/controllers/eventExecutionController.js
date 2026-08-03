const {
  createSiteReceiptService,
  createSiteVerificationService,
  submitReturnAndSettleService,
  getExecutionsByBookingService,
  getExecutionsService,
} = require('../services/eventExecutionService');
const { uploadToCloudinary } = require('../config/cloudinary');

/**
 * Helper to extract existing photos and upload new files to Cloudinary
 */
const getPhotosFromRequest = async (req) => {
  let photos = [];
  const existingPhotos = req.body.existingPhotos || req.body.photos;
  
  if (existingPhotos) {
    if (typeof existingPhotos === 'string') {
      if (existingPhotos.trim().startsWith('[')) {
        try {
          photos = JSON.parse(existingPhotos);
        } catch (e) {
          photos = [existingPhotos];
        }
      } else {
        photos = existingPhotos.split(',').map(u => u.trim()).filter(Boolean);
      }
    } else if (Array.isArray(existingPhotos)) {
      photos = existingPhotos;
    }
  }

  // Upload new files to Cloudinary
  if (req.files && req.files.length > 0) {
    const uploadPromises = req.files.map(file => uploadToCloudinary(file.buffer, 'events', 'image'));
    const uploadResults = await Promise.all(uploadPromises);
    const newUrls = uploadResults.map(res => res.secure_url);
    photos = [...photos, ...newUrls];
  }

  return photos;
};

/**
 * 1. Create Site Receipt (Arrival confirmation at venue)
 */
exports.createSiteReceipt = async (req, res, next) => {
  try {
    const { bookingId, dispatchId, materialCondition, remarks, supervisorName } = req.body;
    const photos = await getPhotosFromRequest(req);

    const execution = await createSiteReceiptService({
      bookingId,
      dispatchId,
      materialCondition,
      remarks,
      supervisorName: supervisorName || req.user?.name,
      photos,
      userId: req.user?._id || req.user?.id,
    });

    return res.status(201).json({
      success: true,
      data: execution,
      message: 'Site Receipt recorded successfully',
    });
  } catch (err) {
    if (err.message === 'Booking not found') {
      return res.status(404).json({ success: false, message: err.message });
    }
    next(err);
  }
};

/**
 * 2. Create Site Verification (Pre-event inspection & photo gallery)
 */
exports.createSiteVerification = async (req, res, next) => {
  try {
    const { bookingId, remarks, supervisorName } = req.body;
    const photos = await getPhotosFromRequest(req);

    const execution = await createSiteVerificationService({
      bookingId,
      remarks,
      photos,
      supervisorName: supervisorName || req.user?.name,
      userId: req.user?._id || req.user?.id,
    });

    return res.status(201).json({
      success: true,
      data: execution,
      message: 'Site Verification & photos recorded successfully',
    });
  } catch (err) {
    if (err.message === 'Booking not found') {
      return res.status(404).json({ success: false, message: err.message });
    }
    next(err);
  }
};

/**
 * 3. Submit Post-Event Return Checklist & Atomic Inventory Settlement
 */
exports.submitReturnAndSettle = async (req, res, next) => {
  try {
    const { bookingId, warehouseId, remarks, returnItems, supervisorName } = req.body;
    
    // Parse returnItems if it was sent as stringified JSON (due to FormData multipart)
    let parsedItems = returnItems;
    if (typeof returnItems === 'string') {
      try {
        parsedItems = JSON.parse(returnItems);
      } catch (e) {
        console.error('Failed to parse returnItems JSON:', e);
      }
    }

    const photos = await getPhotosFromRequest(req);

    const execution = await submitReturnAndSettleService({
      bookingId,
      warehouseId,
      remarks,
      returnItems: parsedItems,
      supervisorName: supervisorName || req.user?.name,
      photos,
      userId: req.user?._id || req.user?.id,
    });

    return res.status(201).json({
      success: true,
      data: execution,
      message: 'Return checklist submitted and godown stock settled successfully',
    });
  } catch (err) {
    if (err.message === 'Booking not found') {
      return res.status(404).json({ success: false, message: err.message });
    }
    next(err);
  }
};

/**
 * 4. Get Execution Records by Booking ID
 */
exports.getExecutionsByBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const executions = await getExecutionsByBookingService(bookingId);
    return res.status(200).json({ success: true, data: executions });
  } catch (err) {
    next(err);
  }
};

/**
 * 5. Get All Event Executions
 */
exports.getExecutions = async (req, res, next) => {
  try {
    const { type } = req.query;
    const executions = await getExecutionsService(type);
    return res.status(200).json({ success: true, data: executions });
  } catch (err) {
    next(err);
  }
};
