const Quotation = require('../models/Quotation');

/**
 * Generate auto-incrementing Quotation ID: QTN-YYMMDD-001
 */
const generateQuotationId = async () => {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const prefix = `QTN-${yy}${mm}${dd}`;

  // Find latest quotation with same date prefix
  const latest = await Quotation.findOne({ quotationId: { $regex: `^${prefix}` } })
    .sort({ quotationId: -1 })
    .lean();

  let seq = 1;
  if (latest) {
    const parts = latest.quotationId.split('-');
    const lastSeq = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastSeq)) seq = lastSeq + 1;
  }

  return `${prefix}-${String(seq).padStart(3, '0')}`;
};

/**
 * Calculate quotation totals from items, charges, and tax rate.
 * @param {Array} items - Array of { rentalRate, quantity, duration, discount }
 * @param {Number} transportCharges
 * @param {Number} labourCharges
 * @param {Number} taxRate - GST percentage (default 18)
 * @returns {{ subtotal, taxAmount, grandTotal }}
 */
const calculateQuotationTotals = (items = [], transportCharges = 0, labourCharges = 0, taxRate = 18, overallDiscount = 0) => {
  const subtotal = 0;
  const totalBeforeDiscount = Number(transportCharges) + Number(labourCharges);
  const discountAmount = (totalBeforeDiscount * (Number(overallDiscount) || 0)) / 100;
  const taxableAmount = Math.max(0, totalBeforeDiscount - discountAmount);
  const taxAmount = Math.round((taxableAmount * (Number(taxRate) || 0)) / 100);
  const grandTotal = taxableAmount + taxAmount;

  return { subtotal, discountAmount, taxableAmount, taxAmount, grandTotal };
};

module.exports = { generateQuotationId, calculateQuotationTotals };
