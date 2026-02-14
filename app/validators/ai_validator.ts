import { z } from 'zod'

export const kcalculatorSchema = z.object({
  meal: z.string().min(1),
})

export const pictureKcalculatorSchema = z.object({
  image: z.string().min(1),
})

export const pictureNutritionSchema = z.object({
  name: z.string(),
  description: z.string(),
  total_calories: z.number(),
  confidence_score: z.number(),
})

export type PictureNutrition = z.infer<typeof pictureNutritionSchema>
