const { z } = require('zod');

exports.loginSchema = {
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required')
  })
};

exports.forgotPasswordSchema = {
  body: z.object({
    email: z.string().email('Invalid email format')
  })
};

exports.resetPasswordSchema = {
  params: z.object({
    resettoken: z.string().min(1, 'Reset token is required')
  }),
  body: z.object({
    password: z.string().min(6, 'Password must be at least 6 characters long')
  })
};

exports.googleAuthSchema = {
  body: z.object({
    code: z.string().min(1, 'Google access token is required')
  })
};
