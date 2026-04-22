import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['designer', 'client']).optional(),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Enter a valid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Please confirm your password'),
    role: z.enum(['designer', 'client']),
    agree: z.literal(true, { errorMap: () => ({ message: 'You must accept the terms' }) }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

export const mockupSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  description: z.string().max(1000).optional().default(''),
  price: z
    .union([z.string(), z.number()])
    .transform((v) => Number(v))
    .refine((n) => !Number.isNaN(n) && n >= 0, 'Price must be a non-negative number'),
  category: z.enum(['Packaging', 'Bottles', 'Apparel', 'Beverage', 'Other']),
});

export const orderSchema = z.object({
  quantity: z
    .union([z.string(), z.number()])
    .transform((v) => Number(v))
    .refine((n) => Number.isInteger(n) && n > 0, 'Quantity must be a positive whole number'),
  notes: z.string().max(1000).optional().default(''),
});

// Turn a ZodError into a { fieldName: message } map for simple form rendering.
export const zodErrorsToFieldMap = (error) => {
  const map = {};
  error.errors.forEach((e) => {
    const key = e.path.join('.') || '_root';
    if (!map[key]) map[key] = e.message;
  });
  return map;
};
