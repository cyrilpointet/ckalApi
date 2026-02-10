import env from '#start/env'
import { OpenRouter } from '@openrouter/sdk'
import { z } from 'zod'
import { nutritionAnalyser, textAnalyser } from './llm_prompts.js'

const DEFAULT_LLM_MODEL = env.get('DEFAULT_LLM_MODEL') || 'tngtech/deepseek-r1t2-chimera:free'

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

export default class LlmService {
  private client: OpenRouter

  constructor() {
    this.client = new OpenRouter({
      apiKey: env.get('OPENROUTER_API_KEY'),
    })
  }

  public async processMealAnalysis(text: string) {
    // 1. Vérification (Modèle rapide/pas cher)
    const check = await this.client.chat.send({
      chatGenerationParams: {
        model: DEFAULT_LLM_MODEL,
        messages: [
          { role: 'system', content: textAnalyser },
          { role: 'user', content: `Est-ce un aliment ? : "${text}"` },
        ],
        responseFormat: { type: 'json_object' },
      },
    })

    const isFood = classificationSchema.parse(
      JSON.parse(extractJson(check.choices[0].message.content as string))
    )

    if (!isFood.is_food) {
      throw new Error('NOT_FOOD_CONTENT')
    }

    // 2. Estimation (Modèle puissant)
    const analysis = await this.client.chat.send({
      chatGenerationParams: {
        model: DEFAULT_LLM_MODEL,
        messages: [
          { role: 'system', content: nutritionAnalyser },
          { role: 'user', content: `Analyse nutritionnelle de : "${text}"` },
        ],
        responseFormat: { type: 'json_object' },
      },
    })

    console.log('Nutrition analysis response:', analysis.choices)

    return nutritionSchema.parse(
      JSON.parse(extractJson(analysis.choices[0].message.content as string))
    )
  }
}
