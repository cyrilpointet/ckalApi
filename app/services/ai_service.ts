/* eslint-disable prettier/prettier */
import env from '#start/env'
import { GoogleGenAI } from '@google/genai'
import logger from '@adonisjs/core/services/logger'
import { z } from 'zod'
import {
  classificationUserPrompt,
  imageAnalysisUserPrompt,
  imageNutritionAnalyser,
  nutritionAnalyser,
  nutritionAnalysisUserPrompt,
  recipeGenerator,
  recipeUserPrompt,
  textAnalyser,
} from './ai_prompts.js'
import { pictureNutritionSchema, recipeResponseSchema } from '#validators/ai_validator'

const DEFAULT_AI_MODEL = env.get('DEFAULT_AI_MODEL') || 'gemini-2.5-flash'
const DEFAULT_IMAGE_ANALYZER = env.get('DEFAULT_IMAGE_ANALYZER') || 'gemini-2.5-flash'

const classificationSchema = z.object({
  is_food: z.boolean(),
  reason: z.string(),
})

const nutritionSchema = z.object({
  total_calories: z.number(),
  confidence_score: z.number(),
})

function extractJson(content: string): string {
  let cleaned = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim()
  const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim()
  }
  const jsonMatch = cleaned.match(/\{[\s\S]*?\}/)
  if (jsonMatch) {
    return jsonMatch[0]
  }
  return cleaned
}

type AiContents =
  | string
  | Array<{ inlineData?: { mimeType: string; data: string }; text?: string }>

export default class AiService {
  private ai: GoogleGenAI

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: env.get('GOOGLE_AI_API_KEY') })
  }

  private async callAi(options: {
    model: string
    systemPrompt: string
    contents: AiContents
  }): Promise<string> {
    try {
      const response = await this.ai.models.generateContent({
        model: options.model,
        contents: options.contents,
        config: {
          systemInstruction: options.systemPrompt,
          responseMimeType: 'application/json',
        },
      })
      console.log('AI response:', response)
      return response.text ?? ''
    } catch (error: any) {
      console.error('AI call error:', error)
      if (error?.status === 429) {
        let retryDelay: string | null = null
        try {
          const parsed = JSON.parse(error.message)
          const retryInfo = parsed.error?.details?.find(
            (d: any) => d['@type']?.includes('RetryInfo')
          )
          if (retryInfo?.retryDelay) {
            retryDelay = retryInfo.retryDelay
          }
        } catch {}
        const err = new Error('AI_RATE_LIMIT') as Error & { retryDelay: string | null }
        err.retryDelay = retryDelay
        throw err
      }
      logger.error({ err: error, model: options.model }, 'AI call failed')
      throw error
    }
  }

  public async processMealAnalysis(text: string) {
    // 1. Vérification (classification)
    const checkRaw = await this.callAi({
      model: DEFAULT_AI_MODEL,
      systemPrompt: textAnalyser,
      contents: classificationUserPrompt(text),
    })

    const isFood = classificationSchema.parse(JSON.parse(extractJson(checkRaw)))

    if (!isFood.is_food) {
      throw new Error('NOT_FOOD_CONTENT')
    }

    // 2. Estimation nutritionnelle
    const analysisRaw = await this.callAi({
      model: DEFAULT_AI_MODEL,
      systemPrompt: nutritionAnalyser,
      contents: nutritionAnalysisUserPrompt(text),
    })

    return nutritionSchema.parse(JSON.parse(extractJson(analysisRaw)))
  }

  public async processPictureAnalysis(base64DataUrl: string) {
    const match = base64DataUrl.match(/^data:(.+?);base64,(.+)$/)
    const mimeType = match?.[1] ?? 'image/jpeg'
    const data = match?.[2] ?? base64DataUrl

    const analysisRaw = await this.callAi({
      model: DEFAULT_IMAGE_ANALYZER,
      systemPrompt: imageNutritionAnalyser,
      contents: [
        {
          text: imageAnalysisUserPrompt,
        },
        {
          inlineData: {
            mimeType,
            data,
          },
        },
      ],
    })

    return pictureNutritionSchema.parse(JSON.parse(extractJson(analysisRaw)))
  }

  public async processRecipeGeneration(input: {
    description?: string
    ingredients?: string[]
    maxKcal?: number
  }) {
    const raw = await this.callAi({
      model: DEFAULT_AI_MODEL,
      systemPrompt: recipeGenerator,
      contents: recipeUserPrompt(input),
    })

    return recipeResponseSchema.parse(JSON.parse(extractJson(raw)))
  }
}
