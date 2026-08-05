const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middlewares/authMiddleware');
const requirePermission = require('../middlewares/requirePermission');

router.use(protect);

router.post('/', requirePermission('payments.create'), paymentController.createPayment);
router.get('/', requirePermission('payments.view'), paymentController.getPayments);
router.get('/:id', requirePermission('payments.view'), paymentController.getPaymentById);
router.delete('/:id', requirePermission('payments.delete'), paymentController.deletePayment);

module.exports = router;
