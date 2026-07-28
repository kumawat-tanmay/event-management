const { z } = require('zod');

// ─── Booking Item Schema ────────────────────────────────────────────────────
const bookingItemZ = z.object({
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

exports.createBookingSchema = {
  body: z.object({
    quotation: z.string().optional(),
    customer: z.string().min(1, 'Customer is required'),
    eventTitle: z.string().min(1, 'Event title is required'),
    eventType: z.enum(['Wedding', 'Reception', 'Corporate', 'Birthday', 'Exhibition', 'Other']).optional(),
    eventStartDate: z.string().min(1, 'Event start date is required'),
    eventEndDate: z.string().min(1, 'Event end date is required'),
    venueAddress: z.string().min(1, 'Venue address is required'),
    items: z.array(bookingItemZ).min(1, 'At least one item is required'),
    subtotal: z.union([z.number(), z.string().transform(Number)]).optional(),
    transportCharges: z.union([z.number(), z.string().transform(Number)]).optional(),
    labourCharges: z.union([z.number(), z.string().transform(Number)]).optional(),
    taxRate: z.union([z.number(), z.string().transform(Number)]).optional(),
    taxAmount: z.union([z.number(), z.string().transform(Number)]).optional(),
    grandTotal: z.union([z.number(), z.string().transform(Number)]).optional(),
    advanceRequired: z.union([z.number(), z.string().transform(Number)]).optional(),
    advancePaid: z.union([z.number(), z.string().transform(Number)]).optional(),
    assignedSupervisor: z.string().optional(),
    notes: z.string().optional()
  })
};

exports.updateBookingSchema = {
  body: z.object({
    customer: z.string().optional(),
    eventTitle: z.string().min(1).optional(),
    eventType: z.enum(['Wedding', 'Reception', 'Corporate', 'Birthday', 'Exhibition', 'Other']).optional(),
    eventStartDate: z.string().optional(),
    eventEndDate: z.string().optional(),
    venueAddress: z.string().optional(),
    items: z.array(bookingItemZ).optional(),
    subtotal: z.union([z.number(), z.string().transform(Number)]).optional(),
    transportCharges: z.union([z.number(), z.string().transform(Number)]).optional(),
    labourCharges: z.union([z.number(), z.string().transform(Number)]).optional(),
    taxRate: z.union([z.number(), z.string().transform(Number)]).optional(),
    taxAmount: z.union([z.number(), z.string().transform(Number)]).optional(),
    grandTotal: z.union([z.number(), z.string().transform(Number)]).optional(),
    advanceRequired: z.union([z.number(), z.string().transform(Number)]).optional(),
    advancePaid: z.union([z.number(), z.string().transform(Number)]).optional(),
    balanceAmount: z.union([z.number(), z.string().transform(Number)]).optional(),
    assignedSupervisor: z.string().optional(),
    status: z.enum(['Draft', 'Confirmed', 'Planning', 'InProgress', 'Completed', 'Cancelled']).optional(),
    notes: z.string().optional()
  })
};
