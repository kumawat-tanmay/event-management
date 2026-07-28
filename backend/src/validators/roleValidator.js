const { z } = require('zod');

exports.createRoleSchema = {
  body: z.object({
    name: z.string().min(1, 'Role name is required'),
    permissions: z.array(z.string()).optional()
  })
};

exports.updateRoleSchema = {
  body: z.object({
    name: z.string().min(1, 'Role name cannot be empty').optional(),
    permissions: z.array(z.string()).optional()
  })
};
