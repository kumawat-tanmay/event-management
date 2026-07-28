const { z } = require('zod');

// ─── Quotation Item Schema ──────────────────────────────────────────────────
const quotationItemZ = z.object({
  item: z.string().min(1, 'Item ID is required'),
  itemName: z.string().min(1, 'Item name is required'),
  itemCode: z.string().optional(),
  unit: z.string().optional(),
  rentalRate: z.union([z.number(), z.string().regex(/^\d+(\.\d+)?$/).transform(Number)]),
  quantity: z.union([z.number().min(1), z.string().regex(/^\d+$/).transform(Number)]),
  duration: z.union([z.number().min(1), z.string().regex(/^\d+$/).transform(Number)]),
  discount: z.union([z.number().min(0).max(100), z.string().regex(/^\d+(\.\d+)?$/).transform(Number)]).optional(),
  totalAmount: z.union([z.number(), z.string().regex(/^\d+(\.\d+)?$/).transform(Number)])
});

exports.createQuotationSchema = {
  body: z.object({
    customer: z.string().min(1, 'Customer is required'),
    lead: z.string().optional(),
    eventTitle: z.string().min(1, 'Event title is required'),
    eventType: z.enum(['Wedding', 'Reception', 'Corporate', 'Birthday', 'Exhibition', 'Other']).optional(),
    eventStartDate: z.string().min(1, 'Event start date is required'),
    eventEndDate: z.string().min(1, 'Event end date is required'),
    venueAddress: z.string().min(1, 'Venue address is required'),
    items: z.array(quotationItemZ).min(1, 'At least one item is required'),
    subtotal: z.union([z.number(), z.string().transform(Number)]).optional(),
    transportCharges: z.union([z.number(), z.string().transform(Number)]).optional(),
    labourCharges: z.union([z.number(), z.string().transform(Number)]).optional(),
    taxRate: z.union([z.number(), z.string().transform(Number)]).optional(),
    taxAmount: z.union([z.number(), z.string().transform(Number)]).optional(),
    grandTotal: z.union([z.number(), z.string().transform(Number)]).optional(),
    termsAndConditions: z.string().optional(),
    validUntil: z.string().optional(),
    notes: z.string().optional()
  })
};

exports.updateQuotationSchema = {
  body: z.object({
    customer: z.string().optional(),
    lead: z.string().optional(),
    eventTitle: z.string().min(1).optional(),
    eventType: z.enum(['Wedding', 'Reception', 'Corporate', 'Birthday', 'Exhibition', 'Other']).optional(),
    eventStartDate: z.string().optional(),
    eventEndDate: z.string().optional(),
    venueAddress: z.string().optional(),
    items: z.array(quotationItemZ).optional(),
    subtotal: z.union([z.number(), z.string().transform(Number)]).optional(),
    transportCharges: z.union([z.number(), z.string().transform(Number)]).optional(),
    labourCharges: z.union([z.number(), z.string().transform(Number)]).optional(),
    taxRate: z.union([z.number(), z.string().transform(Number)]).optional(),
    taxAmount: z.union([z.number(), z.string().transform(Number)]).optional(),
    grandTotal: z.union([z.number(), z.string().transform(Number)]).optional(),
    termsAndConditions: z.string().optional(),
    status: z.enum(['Draft', 'Sent', 'Approved', 'Rejected']).optional(),
    validUntil: z.string().optional(),
    notes: z.string().optional()
  })
};

exports.checkStockSchema = {
  body: z.object({
    items: z.array(z.object({
      item: z.string().min(1, 'Item ID is required'),
      quantity: z.union([z.number().min(1), z.string().regex(/^\d+$/).transform(Number)])
    })).min(1, 'At least one item is required'),
    eventStartDate: z.string().min(1, 'Event start date is required'),
    eventEndDate: z.string().min(1, 'Event end date is required')
  })
};
