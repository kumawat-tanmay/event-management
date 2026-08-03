const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/rbacMiddleware');

router.use(protect);

const financeRoles = ['Owner', 'Admin', 'Accountant'];

router.post('/', authorize(...financeRoles), paymentController.createPayment);
router.get('/', authorize(...financeRoles), paymentController.getPayments);
router.get('/:id', authorize(...financeRoles), paymentController.getPaymentById);
router.delete('/:id', authorize(...financeRoles), paymentController.deletePayment);

module.exports = router;
