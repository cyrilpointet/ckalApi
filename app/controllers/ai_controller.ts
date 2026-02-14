import type { HttpContext } from '@adonisjs/core/http'
import type { Response } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import AiService from '#services/ai_service'
import {
  kcalculatorSchema,
  pictureKcalculatorSchema,
  recipeRequestSchema,
} from '#validators/ai_validator'

function handleAiError(error: unknown, response: Response) {
  if (error instanceof Error) {
    if (error.message === 'NOT_FOOD_CONTENT') {
      return response.badRequest({ message: 'NOT_FOOD_CONTENT' })
    }
    if (error.message === 'AI_RATE_LIMIT') {
      const retryDelay = (error as Error & { retryDelay: string | null }).retryDelay
      return response.tooManyRequests({
        message: 'AI_RATE_LIMIT',
        retryDelay,
      })
    }
  }
  throw error
}

@inject()
export default class AiController {
  constructor(private aiService: AiService) {}

  async kcalculator({ request, response }: HttpContext) {
    const { meal } = kcalculatorSchema.parse(request.all())
    try {
      return await this.aiService.processMealAnalysis(meal)
    } catch (error) {
      return handleAiError(error, response)
    }
  }

  async pictureKcalculator({ request, response }: HttpContext) {
    const { image } = pictureKcalculatorSchema.parse(request.all())
    try {
      return await this.aiService.processPictureAnalysis(image)
    } catch (error) {
      return handleAiError(error, response)
    }
  }

  async generateRecipe({ request, response }: HttpContext) {
    const input = recipeRequestSchema.parse(request.all())
    try {
      return await this.aiService.processRecipeGeneration(input)
    } catch (error) {
      return handleAiError(error, response)
    }
  }
}
