const { z } = require('zod');

exports.createCategorySchema = {
  body: z.object({
    name: z.string().min(1, 'Category name is required'),
    code: z.string().optional(),
    description: z.string().optional(),
    status: z.enum(['Active', 'Inactive']).optional()
  })
};

exports.updateCategorySchema = {
  body: z.object({
    name: z.string().min(1).optional(),
    code: z.string().optional(),
    description: z.string().optional(),
    status: z.enum(['Active', 'Inactive']).optional()
  })
};

exports.createItemSchema = {
  body: z.object({
    name: z.string().min(1, 'Item name is required'),
    code: z.string().optional(),
    category: z.string().min(1, 'Category is required'),
    description: z.string().optional(),
    unit: z.string().optional(),
    rentalPrice: z.union([z.number(), z.string().regex(/^\d+(\.\d+)?$/).transform(Number)]).optional(),
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
    category: z.string().optional(),
    description: z.string().optional(),
    unit: z.string().optional(),
    rentalPrice: z.union([z.number(), z.string().regex(/^\d+(\.\d+)?$/).transform(Number)]).optional(),
    purchaseCost: z.union([z.number(), z.string().regex(/^\d+(\.\d+)?$/).transform(Number)]).optional(),
    minStockAlert: z.union([z.number(), z.string().regex(/^\d+$/).transform(Number)]).optional(),
    isActive: z.boolean().optional(),
    image: z.string().optional()
  })
};
