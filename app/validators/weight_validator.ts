import { z } from 'zod'

export const indexWeightQuerySchema = z.object({
  sort: z.enum(['asc', 'desc']).optional().default('desc'),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  take: z.coerce.number().int().positive().max(100).optional(),
  skip: z.coerce.number().int().nonnegative().optional(),
})

export const createWeightSchema = z.object({
  value: z.number().positive().max(1000),
})

export const updateWeightSchema = z.object({
  value: z.number().positive().max(1000),
})

export type CreateWeightData = z.infer<typeof createWeightSchema>
export type UpdateWeightData = z.infer<typeof updateWeightSchema>
