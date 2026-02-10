import { z } from 'zod'

export const kcalculatorSchema = z.object({
  meal: z.string().min(1),
})
