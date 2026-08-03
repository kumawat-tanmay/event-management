const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/rbacMiddleware');

router.use(protect);

const financeRoles = ['Owner', 'Admin', 'Accountant'];

router.post('/', authorize(...financeRoles), expenseController.createExpense);
router.get('/', authorize(...financeRoles), expenseController.getExpenses);
router.get('/:id', authorize(...financeRoles), expenseController.getExpenseById);
router.delete('/:id', authorize(...financeRoles), expenseController.deleteExpense);

module.exports = router;
