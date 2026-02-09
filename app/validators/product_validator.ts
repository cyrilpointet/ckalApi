import { z } from 'zod'

export const indexProductQuerySchema = z.object({
  sort: z
    .enum(['name', '-name', 'consumed_at', '-consumed_at', 'kcal', '-kcal'])
    .optional()
    .default('-consumed_at'),
  name: z.string().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  kcalMin: z.coerce.number().int().optional(),
  kcalMax: z.coerce.number().int().optional(),
  take: z.coerce.number().int().positive().max(100).optional(),
  skip: z.coerce.number().int().nonnegative().optional(),
})

export const createProductSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().nullable().optional(),
  kcal: z.number().int().nonnegative(),
  consumedAt: z.coerce.date(),
})

export const updateProductSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  kcal: z.number().int().nonnegative().optional(),
  consumedAt: z.coerce.date().optional(),
})

export type CreateProductData = z.infer<typeof createProductSchema>
export type UpdateProductData = z.infer<typeof updateProductSchema>
