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
const dispatchRoutes = require('./dispatchRoutes');
const warehouseTransferRoutes = require('./warehouseTransferRoutes');
const eventExecutionRoutes = require('./eventExecutionRoutes');
const hrRoutes = require('./hr.routes');
const paymentRoutes = require('./paymentRoutes');
const expenseRoutes = require('./expenseRoutes');
const financeRoutes = require('./financeRoutes');
const invoiceRoutes = require('./invoiceRoutes');
const reportRoutes = require('./reportRoutes');
const auditRoutes = require('./auditRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const settingsRoutes = require('./settingsRoutes');

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
router.use('/dispatches', dispatchRoutes);
router.use('/warehouse-transfers', warehouseTransferRoutes);
router.use('/event-execution', eventExecutionRoutes);
router.use('/hr', hrRoutes);
router.use('/payments', paymentRoutes);
router.use('/expenses', expenseRoutes);
router.use('/finance', financeRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/reports', reportRoutes);
router.use('/audit', auditRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/settings', settingsRoutes);

module.exports = router;
