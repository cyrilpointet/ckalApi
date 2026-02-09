import { z } from 'zod'

export const indexDailyCalorieQuerySchema = z.object({
  sort: z.enum(['asc', 'desc']).optional().default('desc'),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  take: z.coerce.number().int().positive().max(100).optional(),
  skip: z.coerce.number().int().nonnegative().optional(),
})

export const createDailyCalorieSchema = z.object({
  value: z.number().int().positive().max(100000),
})

export const updateDailyCalorieSchema = z.object({
  value: z.number().int().positive().max(100000),
})

export type CreateDailyCalorieData = z.infer<typeof createDailyCalorieSchema>
export type UpdateDailyCalorieData = z.infer<typeof updateDailyCalorieSchema>
