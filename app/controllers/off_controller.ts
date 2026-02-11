import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import OpenFoodFactsService from '#services/open_food_facts_service'
import { barcodeParamSchema } from '#validators/off_validator'

@inject()
export default class OffController {
  constructor(private openFoodFactsService: OpenFoodFactsService) {}

  async show({ params, response }: HttpContext) {
    const { barcode } = barcodeParamSchema.parse(params)

    try {
      const product = await this.openFoodFactsService.getProductByBarcode(barcode)
      return product
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'PRODUCT_NOT_FOUND') {
          return response.notFound({ message: 'Product not found on Open Food Facts' })
        }
        if (error.message.startsWith('OFF_API_ERROR')) {
          return response.serviceUnavailable({
            message: 'Open Food Facts API is currently unavailable',
          })
        }
      }
      throw error
    }
  }
}
