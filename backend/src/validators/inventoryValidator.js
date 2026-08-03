const { z } = require('zod');

exports.createItemSchema = {
  body: z.object({
    name: z.string().min(1, 'Item name is required'),
    code: z.string().optional(),
    description: z.string().optional(),
    unit: z.string().optional(),
    totalStock: z.union([z.number(), z.string().regex(/^\d+$/).transform(Number)]).optional(),
    purchaseCost: z.union([z.number(), z.string().regex(/^\d+(\.\d+)?$/).transform(Number)]).optional(),
    minStockAlert: z.union([z.number(), z.string().regex(/^\d+$/).transform(Number)]).optional(),
    isActive: z.boolean().optional(),
    image: z.string().optional()
  })
};

exports.updateItemSchema = {
  body: z.object({
    name: z.string().min(1).optional(),
    code: z.string().optional(),
    description: z.string().optional(),
    unit: z.string().optional(),
    totalStock: z.union([z.number(), z.string().regex(/^\d+$/).transform(Number)]).optional(),
    purchaseCost: z.union([z.number(), z.string().regex(/^\d+(\.\d+)?$/).transform(Number)]).optional(),
    minStockAlert: z.union([z.number(), z.string().regex(/^\d+$/).transform(Number)]).optional(),
    isActive: z.boolean().optional(),
    image: z.string().optional()
  })
};
