import { z } from 'zod';

export const createRecordSchema = z.object({
  body: z.object({
    type: z.enum(['INCOME', 'EXPENSE']),
    amount: z
      .number()
      .positive('Amount must be greater than 0')
      .max(999999999999999, 'Amount is too large'),
    category: z.string().min(1, 'Category is required').max(100),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
  }),
});

export const updateRecordSchema = z.object({
  body: z.object({
    type: z.enum(['INCOME', 'EXPENSE']).optional(),
    amount: z.number().positive('Amount must be greater than 0').optional(),
    category: z.string().min(1).max(100).optional(),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
      .optional(),
    notes: z.string().max(500).optional(),
  }),
});

export const listRecordsSchema = z.object({
  query: z.object({
    type: z.enum(['INCOME', 'EXPENSE']).optional(),
    category: z.string().optional(),
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
    search: z.string().optional(),
  }),
});
