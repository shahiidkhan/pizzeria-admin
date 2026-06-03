import { z } from 'zod';

export const branchSchema = z.object({
  location: z
    .string()
    .trim()
    .min(2, 'Location must be at least 2 characters')
    .max(100, 'Location cannot exceed 100 characters'),
  status: z
    .enum(['open', 'closed'], { required_error: 'Status is required' }),
  contact: z
    .string()
    .trim()
    .min(7, 'Phone number must be at least 7 digits')
    .max(15, 'Phone number cannot exceed 15 digits')
    .regex(/^\+?[0-9\s-]{7,15}$/, 'Enter a valid phone number format (e.g. +923001234567 or 03001234567)'),
});
