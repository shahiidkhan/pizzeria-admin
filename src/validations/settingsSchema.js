import { z } from 'zod';

export const settingsSchema = z.object({
  restaurantName: z
    .string()
    .trim()
    .min(2, 'Restaurant name must be at least 2 characters')
    .max(50, 'Restaurant name cannot exceed 50 characters'),
  contactEmail: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Enter a valid email address'),
  contactPhone: z
    .string()
    .trim()
    .min(7, 'Phone number must be at least 7 digits')
    .max(15, 'Phone number cannot exceed 15 digits')
    .regex(/^\+?[0-9\s-]{7,15}$/, 'Enter a valid phone number'),
  branchStatus: z
    .string()
    .trim()
    .min(1, 'Branch status is required'),
  deliveryFee: z
    .coerce
    .number({ invalid_type_error: 'Delivery fee must be a number' })
    .min(0, 'Delivery fee cannot be negative'),
  currency: z
    .string()
    .trim()
    .min(1, 'Currency is required'),
  taxPercentage: z
    .coerce
    .number({ invalid_type_error: 'Tax percentage must be a number' })
    .min(0, 'Tax percentage cannot be negative')
    .max(100, 'Tax percentage cannot exceed 100'),
  openingTime: z
    .string()
    .trim()
    .min(1, 'Opening time is required'),
  closingTime: z
    .string()
    .trim()
    .min(1, 'Closing time is required'),
});
