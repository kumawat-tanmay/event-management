const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/rbacMiddleware');
const validate = require('../middlewares/validate');
const { z } = require('zod');

const lockSchema = {
  body: z.object({
    locks: z.array(
      z.object({
        itemId: z.string().min(1, 'Item ID is required'),
        warehouseId: z.string().min(1, 'Warehouse ID is required'),
        qty: z.number().min(1, 'Quantity must be at least 1')
      })
    )
  })
};

const suggestSchema = {
  body: z.object({
    reservationId: z.string().min(1, 'Reservation ID is required')
  })
};

// Protect all routes
router.use(protect);

// Only specific roles can manage reservations
const opsRoles = ['Owner', 'Admin', 'Manager'];

router.get('/', authorize(...opsRoles, 'Manager'), reservationController.getAllReservations);
router.get('/booking/:bookingId', authorize(...opsRoles, 'Manager'), reservationController.getReservationByBookingId);

router.post('/', authorize(...opsRoles), reservationController.createReservation);
router.post('/suggest-split', authorize(...opsRoles), validate(suggestSchema), reservationController.suggestSplit);
router.post('/:reservationId/lock', authorize(...opsRoles), validate(lockSchema), reservationController.lockStock);
router.post('/:reservationId/release', authorize(...opsRoles), reservationController.releaseStock);

module.exports = router;
