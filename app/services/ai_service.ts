import env from '#start/env'
import { GoogleGenAI } from '@google/genai'
import logger from '@adonisjs/core/services/logger'
import { z } from 'zod'
import { imageNutritionAnalyser, nutritionAnalyser, textAnalyser } from './llm_prompts.js'
import { pictureNutritionSchema } from '#validators/llm_validator'

const DEFAULT_LLM_MODEL = env.get('DEFAULT_LLM_MODEL') || 'gemini-2.5-flash'
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

type LlmContents =
  | string
  | Array<{ inlineData?: { mimeType: string; data: string }; text?: string }>

export default class LlmService {
  private ai: GoogleGenAI

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: env.get('GOOGLE_AI_API_KEY') })
  }

  private async callLlm(options: {
    model: string
    systemPrompt: string
    contents: LlmContents
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
      return response.text ?? ''
    } catch (error) {
      logger.error({ err: error, model: options.model }, 'LLM call failed')
      throw error
    }
  }

  public async processMealAnalysis(text: string) {
    // 1. Vérification (classification)
    const checkRaw = await this.callLlm({
      model: DEFAULT_LLM_MODEL,
      systemPrompt: textAnalyser,
      contents: `Est-ce un aliment ? : "${text}"`,
    })

    const isFood = classificationSchema.parse(JSON.parse(extractJson(checkRaw)))

    if (!isFood.is_food) {
      throw new Error('NOT_FOOD_CONTENT')
    }

    // 2. Estimation nutritionnelle
    const analysisRaw = await this.callLlm({
      model: DEFAULT_LLM_MODEL,
      systemPrompt: nutritionAnalyser,
      contents: `Analyse nutritionnelle de : "${text}"`,
    })

    return nutritionSchema.parse(JSON.parse(extractJson(analysisRaw)))
  }

  public async processPictureAnalysis(base64DataUrl: string) {
    const match = base64DataUrl.match(/^data:(.+?);base64,(.+)$/)
    const mimeType = match?.[1] ?? 'image/jpeg'
    const data = match?.[2] ?? base64DataUrl

    const analysisRaw = await this.callLlm({
      model: DEFAULT_IMAGE_ANALYZER,
      systemPrompt: imageNutritionAnalyser,
      contents: [
        {
          text: 'Analyse cette image et estime les informations nutritionnelles.',
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
}
