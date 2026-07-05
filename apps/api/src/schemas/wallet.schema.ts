import { z } from 'zod';

export const depositSchema = z.object({
  bundleId: z.string({
    required_error: 'Bundle ID is required',
  }),
});

export const withdrawSchema = z.object({
  crowns: z.number().int().min(200, 'Minimum withdrawal is 200 Crowns ($2.00)'),
  bankAccountId: z.string().optional(),
});

export const bankAccountSchema = z.object({
  country: z.string().optional(),
  bankCode: z.string().min(1, 'Bank code is required'),
  accountNumber: z
    .string()
    .min(3, 'Account number must be at least 3 characters')
    .max(30, 'Account number must be at most 30 characters'),
});
