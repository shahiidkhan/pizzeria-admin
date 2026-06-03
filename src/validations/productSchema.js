import { z } from 'zod';

export const productSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Product name must be at least 2 characters')
    .max(50, 'Product name cannot exceed 50 characters'),
  categoryId: z
    .string()
    .trim()
    .min(1, 'Category is required'),
  type: z
    .string()
    .trim()
    .min(1, 'Type is required'),
  price: z
    .coerce
    .number({ invalid_type_error: 'Price must be a number' })
    .gt(0, 'Price must be greater than 0'),
  ingredients: z
    .string()
    .trim()
    .min(2, 'Ingredients must be at least 2 characters')
    .max(500, 'Ingredients list is too long (max 500 characters)'),
});
