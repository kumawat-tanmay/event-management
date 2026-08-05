const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { protect } = require('../middlewares/authMiddleware');
const requirePermission = require('../middlewares/requirePermission');

router.use(protect);

router.post('/', requirePermission('expenses.create'), expenseController.createExpense);
router.get('/', requirePermission('expenses.view'), expenseController.getExpenses);
router.get('/:id', requirePermission('expenses.view'), expenseController.getExpenseById);
router.delete('/:id', requirePermission('expenses.delete'), expenseController.deleteExpense);

module.exports = router;
