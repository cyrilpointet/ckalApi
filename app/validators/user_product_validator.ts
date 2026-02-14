import { z } from 'zod'

export const indexUserProductQuerySchema = z.object({
  sort: z
    .enum(['consumed_at', '-consumed_at', 'created_at', '-created_at'])
    .optional()
    .default('-consumed_at'),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  name: z.string().optional(),
  take: z.coerce.number().int().positive().max(100).optional(),
  skip: z.coerce.number().int().nonnegative().optional(),
})

export const createUserProductSchema = z.object({
  productId: z.string().uuid(),
  consumedAt: z.coerce.date(),
  quantity: z.number().int().positive().default(1),
})

export const updateUserProductSchema = z.object({
  consumedAt: z.coerce.date().optional(),
  quantity: z.number().int().positive().optional(),
})

export type CreateUserProductData = z.infer<typeof createUserProductSchema>
export type UpdateUserProductData = z.infer<typeof updateUserProductSchema>
