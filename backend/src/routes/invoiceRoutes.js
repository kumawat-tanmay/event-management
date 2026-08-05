const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { protect } = require('../middlewares/authMiddleware');
const requirePermission = require('../middlewares/requirePermission');

router.use(protect);

router.post('/generate', requirePermission('invoices.create'), invoiceController.createInvoice);
router.get('/', requirePermission('invoices.view'), invoiceController.getInvoices);
router.get('/:id', requirePermission('invoices.view'), invoiceController.getInvoiceById);
router.delete('/:id', requirePermission('invoices.delete'), invoiceController.deleteInvoice);

module.exports = router;
