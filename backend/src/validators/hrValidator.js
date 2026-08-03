const { z } = require('zod');

exports.createStaffSchema = {
  body: z.object({
    name: z.string().min(1, 'Staff name is required'),
    phone: z.string().min(1, 'Phone number is required'),
    email: z.string().optional(),
    role: z.enum(['Driver', 'Event Supervisor', 'Godown Manager', 'Labour', 'Accountant', 'Other']).optional(),
    joinedDate: z.string().optional(),
    compensationType: z.enum(['daily', 'monthly']).optional(),
    basePay: z.union([z.number(), z.string().transform(Number)]).optional(),
    totalPaid: z.union([z.number(), z.string().transform(Number)]).optional(),
    pendingDues: z.union([z.number(), z.string().transform(Number)]).optional(),
    status: z.enum(['Active', 'Inactive', 'On Leave']).optional()
  })
};

exports.updateStaffSchema = {
  body: z.object({
    name: z.string().min(1).optional(),
    phone: z.string().min(1).optional(),
    email: z.string().optional(),
    role: z.enum(['Driver', 'Event Supervisor', 'Godown Manager', 'Labour', 'Accountant', 'Other']).optional(),
    joinedDate: z.string().optional(),
    compensationType: z.enum(['daily', 'monthly']).optional(),
    basePay: z.union([z.number(), z.string().transform(Number)]).optional(),
    totalPaid: z.union([z.number(), z.string().transform(Number)]).optional(),
    pendingDues: z.union([z.number(), z.string().transform(Number)]).optional(),
    status: z.enum(['Active', 'Inactive', 'On Leave']).optional()
  })
};

exports.logPaymentSchema = {
  body: z.object({
    amount: z.union([z.number(), z.string().transform(Number)]).optional(),
    type: z.enum(['Salary', 'Advance', 'Allowance', 'Bonus']).optional(),
    mode: z.enum(['Cash', 'UPI', 'Bank Transfer', 'Cheque']).optional(),
    notes: z.string().optional(),
    newPendingDues: z.union([z.number(), z.string().transform(Number)]).optional()
  })
};

exports.createVehicleSchema = {
  body: z.object({
    name: z.string().min(1, 'Vehicle name is required'),
    plateNumber: z.string().min(1, 'Plate number is required'),
    type: z.enum(['Pickup 407', 'Tata Ace', 'Heavy Truck', 'Bolero', 'Van', 'Tractor', 'Other']).optional(),
    capacity: z.string().optional(),
    assignedDriverId: z.string().nullable().optional(),
    status: z.enum(['available', 'on_dispatch', 'maintenance']).optional(),
    ownership: z.enum(['company', 'rented']).optional()
  })
};

exports.updateVehicleSchema = {
  body: z.object({
    name: z.string().min(1).optional(),
    plateNumber: z.string().min(1).optional(),
    type: z.enum(['Pickup 407', 'Tata Ace', 'Heavy Truck', 'Bolero', 'Van', 'Tractor', 'Other']).optional(),
    capacity: z.string().optional(),
    assignedDriverId: z.string().nullable().optional(),
    status: z.enum(['available', 'on_dispatch', 'maintenance']).optional(),
    ownership: z.enum(['company', 'rented']).optional()
  })
};
