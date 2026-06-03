import { z } from 'zod';

export const offerSchema = z.object({
  productId: z
    .string()
    .trim()
    .min(1, 'Please select a product'),
  discountPrice: z
    .coerce
    .number({ invalid_type_error: 'Discounted price must be a number' })
    .gt(0, 'Discounted price must be greater than 0'),
  expiryDate: z
    .string()
    .min(1, 'Expiry date is required')
    .refine((val) => {
      const date = new Date(val);
      if (isNaN(date.getTime())) return false;
      // Compare to start of today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date >= today;
    }, { message: 'Expiry date must be today or in the future' }),
  status: z
    .string()
    .trim()
    .min(1, 'Status is required'),
});
