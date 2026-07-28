const express = require('express');
const router = express.Router();
const {
  getQuotations,
  getQuotationById,
  createQuotation,
  updateQuotation,
  deleteQuotation,
  checkStock,
  convertToBooking
} = require('../controllers/quotationController');
const { protect } = require('../middlewares/authMiddleware');
const requirePermission = require('../middlewares/requirePermission');
const validate = require('../middlewares/validate');
const { createQuotationSchema, updateQuotationSchema, checkStockSchema } = require('../validators/quotationValidator');

router.use(protect);

// Stock check (must be before /:id to avoid route conflict)
router.post('/check-stock', requirePermission('quotations.create'), validate(checkStockSchema), checkStock);

// CRUD Routes
router.get('/', requirePermission('quotations.view'), getQuotations);
router.post('/', requirePermission('quotations.create'), validate(createQuotationSchema), createQuotation);
router.get('/:id', requirePermission('quotations.view'), getQuotationById);
router.put('/:id', requirePermission('quotations.update'), validate(updateQuotationSchema), updateQuotation);
router.delete('/:id', requirePermission('quotations.delete'), deleteQuotation);

// Convert to booking
router.post('/:id/convert-booking', requirePermission('quotations.approve'), convertToBooking);

module.exports = router;
