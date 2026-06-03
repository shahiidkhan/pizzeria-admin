import { z } from 'zod';

export const dealSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Deal name must be at least 2 characters')
    .max(50, 'Deal name cannot exceed 50 characters'),
  description: z
    .string()
    .trim()
    .min(5, 'Description must be at least 5 characters')
    .max(300, 'Description cannot exceed 300 characters'),
  dealPrice: z
    .coerce
    .number({ invalid_type_error: 'Deal price must be a number' })
    .gt(0, 'Deal price must be greater than 0'),
});
