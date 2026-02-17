import { z } from 'zod'
import type { OffProduct } from '#validators/off_validator'

const OFF_BASE_URL = 'https://world.openfoodfacts.org/api/v2/product'
const USER_AGENT = 'KcalApp/1.0 (https://github.com/cyrilpointet/kcal)'

const offApiResponseSchema = z.object({
  status: z.number(),
  product: z
    .object({
      product_name: z.string().default(''),
      generic_name: z.string().default(''),
      product_quantity: z.number().optional(),
      quantity: z.string().default(''),
      nutriments: z
        .object({
          'energy-kcal_100g': z.number().optional(),
          'energy-kcal': z.number().optional(),
          'proteins_100g': z.number().optional(),
          'carbohydrates_100g': z.number().optional(),
          'fat_100g': z.number().optional(),
        })
        .optional(),
    })
    .optional(),
})

export default class OpenFoodFactsService {
  public async getProductByBarcode(barcode: string): Promise<OffProduct> {
    const response = await fetch(`${OFF_BASE_URL}/${barcode}.json`, {
      headers: {
        'User-Agent': USER_AGENT,
      },
    })

    if (!response.ok) {
      throw new Error(`OFF_API_ERROR: HTTP ${response.status}`)
    }

    const rawData = await response.json()
    const parsed = offApiResponseSchema.parse(rawData)

    if (parsed.status !== 1 || !parsed.product) {
      throw new Error('PRODUCT_NOT_FOUND')
    }

    const product = parsed.product
    const kcalPer100g =
      product.nutriments?.['energy-kcal_100g'] ?? product.nutriments?.['energy-kcal'] ?? 0
    const proteinPer100g = product.nutriments?.['proteins_100g'] ?? 0
    const carbPer100g = product.nutriments?.['carbohydrates_100g'] ?? 0
    const fatPer100g = product.nutriments?.['fat_100g'] ?? 0
    const weight = product.product_quantity ?? 0
    const kcal = weight > 0 ? Math.round((kcalPer100g * weight) / 100) : 0
    const protein = weight > 0 ? Math.round(((proteinPer100g * weight) / 100) * 100) / 100 : 0
    const carbohydrate = weight > 0 ? Math.round(((carbPer100g * weight) / 100) * 100) / 100 : 0
    const lipid = weight > 0 ? Math.round(((fatPer100g * weight) / 100) * 100) / 100 : 0

    return {
      name: product.product_name || 'Unknown',
      description: [product.generic_name, product.quantity].filter(Boolean).join(' - '),
      weight,
      kcal,
      protein,
      carbohydrate,
      lipid,
    }
  }
}
