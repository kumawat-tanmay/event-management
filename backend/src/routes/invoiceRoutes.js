const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/rbacMiddleware');

router.use(protect);

const financeRoles = ['Owner', 'Admin', 'Accountant'];

router.post('/generate', authorize(...financeRoles), invoiceController.createInvoice);
router.get('/', authorize(...financeRoles), invoiceController.getInvoices);
router.get('/:id', authorize(...financeRoles), invoiceController.getInvoiceById);
router.delete('/:id', authorize(...financeRoles), invoiceController.deleteInvoice);

module.exports = router;
