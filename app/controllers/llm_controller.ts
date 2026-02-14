import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import LlmService from '#services/llm_service'
import { kcalculatorSchema, pictureKcalculatorSchema } from '#validators/llm_validator'

@inject()
export default class LlmController {
  constructor(private llmService: LlmService) {}

  async kcalculator({ request, response }: HttpContext) {
    const { meal } = kcalculatorSchema.parse(request.all())
    try {
      return await this.llmService.processMealAnalysis(meal)
    } catch (error) {
      if (error instanceof Error && error.message === 'NOT_FOOD_CONTENT') {
        return response.badRequest({ message: 'NOT_FOOD_CONTENT' })
      }
      throw error
    }
  }

  async pictureKcalculator({ request }: HttpContext) {
    const { image } = pictureKcalculatorSchema.parse(request.all())
    return await this.llmService.processPictureAnalysis(image)
  }
}
