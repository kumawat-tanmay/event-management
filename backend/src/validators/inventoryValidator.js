const { z } = require('zod');

const warehouseStockEntrySchema = z.object({
  warehouse: z.string().min(1),
  zoneId: z.string().optional().nullable(),
  rackId: z.string().optional().nullable(),
  zoneName: z.string().optional().nullable(),
  rackName: z.string().optional().nullable(),
  quantity: z.union([z.number(), z.string().regex(/^\d+$/).transform(Number)]).default(0),
  unitCost: z.union([z.number(), z.string().regex(/^\d+(\.\d+)?$/).transform(Number)]).optional()
});

exports.createItemSchema = {
  body: z.object({
    name: z.string().min(1, 'Item name is required'),
    code: z.string().optional(),
    description: z.string().optional(),
    unit: z.string().optional(),
    rentalPrice: z.union([z.number(), z.string().regex(/^\d+(\.\d+)?$/).transform(Number)]).optional(),
    totalStock: z.union([z.number(), z.string().regex(/^\d+$/).transform(Number)]).optional(),
    purchaseCost: z.union([z.number(), z.string().regex(/^\d+(\.\d+)?$/).transform(Number)]).optional(),
    minStockAlert: z.union([z.number(), z.string().regex(/^\d+$/).transform(Number)]).optional(),
    isActive: z.boolean().optional(),
    image: z.string().optional(),
    warehouseStock: z.array(warehouseStockEntrySchema).optional()
  })
};

exports.updateItemSchema = {
  body: z.object({
    name: z.string().min(1).optional(),
    code: z.string().optional(),
    description: z.string().optional(),
    unit: z.string().optional(),
    rentalPrice: z.union([z.number(), z.string().regex(/^\d+(\.\d+)?$/).transform(Number)]).optional(),
    totalStock: z.union([z.number(), z.string().regex(/^\d+$/).transform(Number)]).optional(),
    purchaseCost: z.union([z.number(), z.string().regex(/^\d+(\.\d+)?$/).transform(Number)]).optional(),
    minStockAlert: z.union([z.number(), z.string().regex(/^\d+$/).transform(Number)]).optional(),
    isActive: z.boolean().optional(),
    image: z.string().optional(),
    warehouseStock: z.array(warehouseStockEntrySchema).optional()
  })
};
