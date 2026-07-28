const express = require('express');
const router = express.Router();
const {
  getBookings,
  getBookingById,
  createBooking,
  updateBooking,
  deleteBooking,
  signAgreement
} = require('../controllers/bookingController');
const { protect } = require('../middlewares/authMiddleware');
const requirePermission = require('../middlewares/requirePermission');
const validate = require('../middlewares/validate');
const { createBookingSchema, updateBookingSchema } = require('../validators/bookingValidator');

router.use(protect);

// CRUD Routes
router.get('/', requirePermission('bookings.view'), getBookings);
router.post('/', requirePermission('bookings.create'), validate(createBookingSchema), createBooking);
router.get('/:id', requirePermission('bookings.view'), getBookingById);
router.put('/:id', requirePermission('bookings.update'), validate(updateBookingSchema), updateBooking);
router.delete('/:id', requirePermission('bookings.delete'), deleteBooking);

// Agreement signing
router.post('/:id/agreement', requirePermission('bookings.update'), signAgreement);

module.exports = router;
