import { z } from 'zod';

// ─── Reusable Field Schemas ──────────────────────────────────────────────────
// Note: Zod v4 uses { message } instead of { required_error }

const emailField = z
  .string({ message: 'Email is required' })
  .min(1, 'Email is required')
  .max(100, 'Email must be less than 100 characters')
  .email('Please enter a valid email address')
  .transform((val) => val.trim().toLowerCase());

const passwordField = z
  .string({ message: 'Password is required' })
  .min(1, 'Password is required')
  .max(50, 'Password must be less than 50 characters');

const strongPasswordField = z
  .string({ message: 'Password is required' })
  .min(8, 'Password must be at least 8 characters')
  .max(50, 'Password must be less than 50 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

// ─── Auth Schemas ────────────────────────────────────────────────────────────

/**
 * Login form schema
 * Used in: LoginForm.tsx
 */
export const loginSchema = z.object({
  email: emailField,
  password: passwordField,
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Email-only schema (forgot password)
 * Used in: ForgotPasswordForm.tsx
 */
export const emailSchema = emailField;

export type EmailInput = z.infer<typeof emailSchema>;

/**
 * Reset password schema (token-based)
 * Used in: ResetPasswordForm.tsx
 */
export const resetPasswordSchema = z
  .object({
    newPassword: strongPasswordField,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// ─── Common Field Schemas (for future forms) ─────────────────────────────────

/**
 * Phone number validation (Indian format)
 */
export const phoneField = z
  .string()
  .min(10, 'Phone number must be at least 10 digits')
  .max(15, 'Phone number is too long')
  .regex(/^[+]?[0-9\s\-()]+$/, 'Please enter a valid phone number');

/**
 * Name field validation
 */
export const nameField = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must be less than 100 characters')
  .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces');
