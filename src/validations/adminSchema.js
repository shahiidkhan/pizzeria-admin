import { z } from 'zod';

export const adminSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name cannot exceed 50 characters'),
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Enter a valid email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters'),
  role: z
    .string()
    .trim()
    .min(1, 'Role is required'),
  branchId: z
    .string()
    .optional(),
  image: z
    .string()
    .trim()
    .url('Enter a valid image URL')
    .or(z.literal(''))
    .optional(),
});
