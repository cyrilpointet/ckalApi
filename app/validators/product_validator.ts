import { z } from 'zod'

export const indexProductQuerySchema = z.object({
  sort: z
    .enum(['name', '-name', 'kcal', '-kcal', 'created_at', '-created_at', 'updated_at', '-updated_at'])
    .optional()
    .default('name'),
  name: z.string().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  kcalMin: z.coerce.number().int().optional(),
  kcalMax: z.coerce.number().int().optional(),
  isRecipe: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
  take: z.coerce.number().int().positive().max(100).optional(),
  skip: z.coerce.number().int().nonnegative().optional(),
})

export const createProductSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().nullable().optional(),
  kcal: z.number().int().nonnegative(),
  barcode: z.string().nullable().optional(),
  isRecipe: z.boolean().optional().default(false),
})

export const updateProductSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  kcal: z.number().int().nonnegative().optional(),
  barcode: z.string().nullable().optional(),
  isRecipe: z.boolean().optional(),
})

export type CreateProductData = z.infer<typeof createProductSchema>
export type UpdateProductData = z.infer<typeof updateProductSchema>
