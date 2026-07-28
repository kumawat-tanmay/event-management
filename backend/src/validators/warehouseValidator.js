const { z } = require('zod');

const rackSchema = z.object({
  name: z.string().min(1, 'Rack name is required'),
  capacity: z.string().optional(),
  description: z.string().optional()
});

const zoneSchema = z.object({
  name: z.string().min(1, 'Zone name is required'),
  code: z.string().optional(),
  description: z.string().optional(),
  racks: z.array(rackSchema).optional()
});

exports.createWarehouseSchema = {
  body: z.object({
    name: z.string().min(1, 'Warehouse name is required'),
    code: z.string().optional(),
    location: z.string().optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
    capacity: z.union([z.number(), z.string().regex(/^\d+$/).transform(Number)]).optional(),
    managerId: z.string().optional(),
    incharge: z.string().optional(),
    isDefault: z.boolean().optional(),
    isActive: z.boolean().optional(),
    zones: z.array(zoneSchema).optional()
  })
};

exports.updateWarehouseSchema = {
  body: z.object({
    name: z.string().min(1, 'Warehouse name cannot be empty').optional(),
    code: z.string().optional(),
    location: z.string().optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
    capacity: z.union([z.number(), z.string().regex(/^\d+$/).transform(Number)]).optional(),
    managerId: z.string().optional(),
    incharge: z.string().optional(),
    isDefault: z.boolean().optional(),
    isActive: z.boolean().optional(),
    zones: z.array(zoneSchema).optional()
  })
};
