import { z } from 'zod'

export const barcodeParamSchema = z.object({
  barcode: z.string().regex(/^\d{4,14}$/, 'Barcode must be a numeric string of 4 to 14 digits'),
})

export const offProductSchema = z.object({
  name: z.string(),
  description: z.string(),
  weight: z.number(),
  kcal: z.number(),
  protein: z.number(),
  carbohydrate: z.number(),
  lipid: z.number(),
})

export type OffProduct = z.infer<typeof offProductSchema>
