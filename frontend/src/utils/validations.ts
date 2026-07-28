import { z } from 'zod';

// ─── Reusable Field Schema Factories ──────────────────────────────────────────
// Parameterized by t (translator function) to dynamically return active language

const getEmailField = (t: any) => z
  .string({ message: t('validation.emailRequired', 'Email is required') })
  .min(1, t('validation.emailRequired', 'Email is required'))
  .max(100, t('validation.emailMax', 'Email must be less than 100 characters'))
  .email(t('validation.emailInvalid', 'Please enter a valid email address'))
  .transform((val) => val.trim().toLowerCase());

const getPasswordField = (t: any) => z
  .string({ message: t('validation.passwordRequired', 'Password is required') })
  .min(1, t('validation.passwordRequired', 'Password is required'))
  .max(50, t('validation.passwordMax', 'Password must be less than 50 characters'));

const getStrongPasswordField = (t: any) => z
  .string({ message: t('validation.passwordRequired', 'Password is required') })
  .min(8, t('validation.passwordMin', 'Password must be at least 8 characters'))
  .max(50, t('validation.passwordMax', 'Password must be less than 50 characters'))
  .regex(/[A-Z]/, t('validation.passwordUppercase', 'Password must contain at least one uppercase letter'))
  .regex(/[a-z]/, t('validation.passwordLowercase', 'Password must contain at least one lowercase letter'))
  .regex(/[0-9]/, t('validation.passwordNumber', 'Password must contain at least one number'));

// ─── Auth Schemas ────────────────────────────────────────────────────────────

/**
 * Login form schema builder
 */
export const getLoginSchema = (t: any) => z.object({
  email: getEmailField(t),
  password: getPasswordField(t),
});

/**
 * Email-only schema builder (forgot password)
 */
export const getEmailSchema = (t: any) => getEmailField(t);

/**
 * Reset password schema builder (token-based)
 */
export const getResetPasswordSchema = (t: any) => z
  .object({
    newPassword: getStrongPasswordField(t),
    confirmPassword: z.string().min(1, t('validation.confirmPasswordRequired', 'Please confirm your password')),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: t('validation.passwordsDoNotMatch', 'Passwords do not match'),
    path: ['confirmPassword'],
  });

// ─── Common Field Schemas ─────────────────────────────────────────────────────

/**
 * Phone number validation (Indian format)
 */
export const getPhoneField = (t: any) => z
  .string()
  .min(10, t('validation.phoneMin', 'Phone number must be at least 10 digits'))
  .max(15, t('validation.phoneMax', 'Phone number is too long'))
  .regex(/^[+]?[0-9\s\-()]+$/, t('validation.phoneInvalid', 'Please enter a valid phone number'));

/**
 * Name field validation
 */
export const getNameField = (t: any) => z
  .string()
  .min(2, t('validation.nameMin', 'Name must be at least 2 characters'))
  .max(100, t('validation.nameMax', 'Name must be less than 100 characters'))
  .regex(/^[a-zA-Z\s\u0900-\u097F]+$/, t('validation.nameLetters', 'Name can only contain letters and spaces'));

// ─── Warehouse / Godown Schema ───────────────────────────────────────────────

/**
 * Warehouse / Godown Form schema builder
 */
export const getWarehouseSchema = (t: any) => z.object({
  name: z
    .string({ message: t('validation.warehouseNameRequired', 'Warehouse name is required') })
    .min(2, t('validation.warehouseNameMin', 'Warehouse name must be at least 2 characters'))
    .max(100, t('validation.warehouseNameMax', 'Warehouse name must be less than 100 characters'))
    .transform((val) => val.trim()),
  code: z
    .string()
    .max(20, t('validation.warehouseCodeMax', 'Warehouse code must be less than 20 characters'))
    .optional()
    .transform((val) => val ? val.trim().toUpperCase() : undefined),
  address: z
    .string()
    .max(300, t('validation.addressMax', 'Address must be less than 300 characters'))
    .optional(),
  phone: z
    .string()
    .max(20, t('validation.phoneMaxLimit', 'Phone number must be less than 20 characters'))
    .optional(),
  capacity: z
    .number({ message: t('validation.capacityNumber', 'Capacity must be a number') })
    .min(1, t('validation.capacityMin', 'Capacity must be at least 1 unit'))
    .max(1000000, t('validation.capacityMax', 'Capacity cannot exceed 1,000,000 units'))
    .optional(),
  isDefault: z.boolean().default(false),
});

// ─── Category Schema Builder ─────────────────────────────────────────────────
export const getCategorySchema = (t: any) => z.object({
  name: z.string({ message: t('validation.categoryNameRequired', 'Category name is required') })
    .min(2, t('validation.categoryNameMin', 'Category name must be at least 2 characters'))
    .max(100, t('validation.categoryNameMax', 'Category name must be less than 100 characters'))
    .transform(val => val.trim()),
  code: z.string()
    .max(10, t('validation.categoryCodeMax', 'Code must be less than 10 characters'))
    .transform(val => val.trim().toUpperCase())
    .optional(),
  description: z.string()
    .max(500, t('validation.descriptionMax', 'Description must be less than 500 characters'))
    .optional(),
  status: z.enum(['Active', 'Inactive']).default('Active'),
});

// ─── Item Master Schema Builder ──────────────────────────────────────────────
export const getItemSchema = (t: any) => z.object({
  name: z.string({ message: t('validation.itemNameRequired', 'Item name is required') })
    .min(2, t('validation.itemNameMin', 'Item name must be at least 2 characters'))
    .max(200, t('validation.itemNameMax', 'Item name must be less than 200 characters'))
    .transform(val => val.trim()),
  code: z.string()
    .max(30, t('validation.itemCodeMax', 'SKU code must be less than 30 characters'))
    .transform(val => val.trim().toUpperCase())
    .optional(),
  category: z.string({ message: t('validation.categoryRequired', 'Category is required') })
    .min(1, t('validation.categoryRequired', 'Please select a category')),
  description: z.string()
    .max(1000, t('validation.itemDescriptionMax', 'Description must be less than 1000 characters'))
    .optional(),
  unit: z.enum(['Pieces','Sets','SqFt','Meters','Kg','Rolls','Bundles','Pairs','Boxes'])
    .default('Pieces'),
  rentalPrice: z.number({ message: t('validation.rentalPriceNumber', 'Rental price must be a number') })
    .min(0, t('validation.rentalPriceMin', 'Rental price cannot be negative'))
    .default(0),
  purchaseCost: z.number({ message: t('validation.purchaseCostNumber', 'Purchase cost must be a number') })
    .min(0, t('validation.purchaseCostMin', 'Purchase cost cannot be negative'))
    .default(0),
  minStockAlert: z.number()
    .min(0, t('validation.minStockAlertMin', 'Minimum stock cannot be negative'))
    .default(0),
  isActive: z.boolean().default(true),
});

// ─── CRM Customer Schema Builder ─────────────────────────────────────────────
export const getCustomerSchema = (t: any) => z.object({
  name: z.string({ message: t('validation.customerNameRequired', 'Customer name is required') })
    .min(2, t('validation.customerNameMin', 'Name must be at least 2 characters'))
    .transform(val => val.trim()),
  type: z.enum(['Retail', 'Corporate']).default('Retail'),
  contactPerson: z.string().optional(),
  phone: z.string({ message: t('validation.phoneRequired', 'Phone number is required') })
    .min(10, t('validation.phoneMin', 'Phone number must be at least 10 digits')),
  email: z.string().email(t('validation.emailInvalid', 'Invalid email address')).optional().or(z.literal('')),
  address: z.string({ message: t('validation.addressRequired', 'Billing address is required') })
    .min(5, t('validation.addressMin', 'Address must be at least 5 characters')),
  gstNumber: z.string().optional(),
  creditLimit: z.number().min(0).optional(),
  paymentTerms: z.number().min(0).optional(),
});

// ─── CRM Lead Schema Builder ─────────────────────────────────────────────────
export const getLeadSchema = (t: any) => z.object({
  customerName: z.string({ message: t('validation.customerNameRequired', 'Customer name is required') })
    .min(2, t('validation.customerNameMin', 'Name must be at least 2 characters')),
  phone: z.string({ message: t('validation.phoneRequired', 'Phone number is required') })
    .min(10, t('validation.phoneMin', 'Phone number must be at least 10 digits')),
  email: z.string().email().optional().or(z.literal('')),
  eventType: z.string({ message: t('validation.eventTypeRequired', 'Event type is required') })
    .min(2, t('validation.eventTypeMin', 'Event type is required')),
  eventDate: z.string().optional(),
  source: z.enum(['Instagram', 'Reference', 'Website', 'Walk-in', 'Call', 'Other']).default('Walk-in'),
  stage: z.enum(['New', 'Contacted', 'Site Visit', 'Quotation', 'Booked', 'Lost']).default('New'),
  notes: z.string().optional(),
});

// ─── CRM Site Visit Schema Builder ───────────────────────────────────────────
export const getSiteVisitSchema = (t: any) => z.object({
  customerName: z.string({ message: t('validation.customerNameRequired', 'Customer name is required') })
    .min(2, t('validation.customerNameMin', 'Name must be at least 2 characters')),
  phone: z.string({ message: t('validation.phoneRequired', 'Phone number is required') })
    .min(10, t('validation.phoneMin', 'Phone number must be at least 10 digits')),
  visitDate: z.string({ message: t('validation.visitDateRequired', 'Visit date is required') }),
  venueAddress: z.string({ message: t('validation.venueAddressRequired', 'Venue address is required') })
    .min(5, t('validation.venueAddressMin', 'Venue address must be at least 5 characters')),
  notes: z.string().optional(),
});


