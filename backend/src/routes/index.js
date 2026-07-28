const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const roleRoutes = require('./roleRoutes');
const userRoutes = require('./userRoutes');
const warehouseRoutes = require('./warehouseRoutes');
const inventoryRoutes = require('./inventoryRoutes');
const crmRoutes = require('./crmRoutes');
const quotationRoutes = require('./quotationRoutes');
const bookingRoutes = require('./bookingRoutes');
const reservationRoutes = require('./reservationRoutes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/roles', roleRoutes);
router.use('/users', userRoutes);
router.use('/warehouses', warehouseRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/crm', crmRoutes);
router.use('/quotations', quotationRoutes);
router.use('/bookings', bookingRoutes);
router.use('/reservations', reservationRoutes);

module.exports = router;
