import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { getAuthenticatedUser, getServiceClient } from "../_shared/auth.ts"
import { corsHeaders } from "../_shared/cors.ts"
import { createResponse } from "../_shared/response.ts"

/**
 * generate-nutrition
 *
 * Generates a per-serving and per-100g/ml nutritional table from a recipe's ingredients list.
 * Uses OpenAI GPT as the primary provider, Gemini as automatic fallback.
 * Calculates %VD (ANVISA RDC 429/2020) and kJ values programmatically.
 */

interface Ingredient {
  name: string
  quantity_label: string | null
  unit: string | null
}

interface NutrientValue {
  per_100g: number
  per_serving: number
  vd_percent: number | null
}

interface NutritionInfo {
  serving_size_g_ml: number
  serving_size_household: string
  nutrients: {
    energy_kcal: NutrientValue
    energy_kj: NutrientValue
    carbs: NutrientValue
    total_sugars: NutrientValue
    added_sugars: NutrientValue
    protein: NutrientValue
    fat: NutrientValue
    saturated_fat: NutrientValue
    trans_fat: NutrientValue
    fiber: NutrientValue
    sodium: NutrientValue
  }
}

interface AISchema {
  serving_size_g_ml: number
  serving_size_household: string
  calories: number
  carbs: number
  total_sugars: number
  added_sugars: number
  protein: number
  fat: number
  saturated_fat: number
  trans_fat: number
  fiber: number
  sodium: number
}

interface AIConfig {
  openai_api_key: string
  gemini_api_key: string
  preferred_provider: 'openai' | 'gemini'
}

// ANVISA Reference values (RDC 429/2020)
const REF_ENERGY_KCAL = 2000
const REF_ENERGY_KJ = 8400
const REF_CARBS = 300
const REF_ADDED_SUGARS = 50
const REF_PROTEIN = 50
const REF_FAT = 65
const REF_SATURATED_FAT = 22
const REF_FIBER = 25
const REF_SODIUM = 2000

// ─── Prompt builder ────────────────────────────────────────────────────────────

function buildPrompt(ingredients: Ingredient[], servings: number): string {
  const ingredientList = ingredients
    .map(i => {
      const qty = i.quantity_label ? i.quantity_label : ''
      const unit = i.unit ? i.unit : ''
      return `- ${i.name}${qty || unit ? `: ${qty} ${unit}`.trim() : ''}`
    })
    .join('\n')

  return `Você é um nutricionista especializado. Analise a lista de ingredientes abaixo de uma receita que rende ${servings} porção(ões) e estime a tabela nutricional POR PORÇÃO.

Ingredientes:
${ingredientList}

Responda APENAS com um JSON válido, sem texto extra, no formato exato:
{
  "serving_size_g_ml": <peso ou volume estimado de uma única porção em gramas (g) ou mililitros (ml), número inteiro>,
  "serving_size_household": "<medida caseira para uma porção, ex: '1 xícara de chá', '1 fatia', '2 colheres de sopa'>",
  "calories": <calorias por porção em kcal, número>,
  "carbs": <carboidratos em gramas por porção, número>,
  "total_sugars": <açúcares totais em gramas por porção, número>,
  "added_sugars": <açúcares adicionados em gramas por porção, número>,
  "protein": <proteínas em gramas por porção, número>,
  "fat": <gorduras totais em gramas por porção, número>,
  "saturated_fat": <gorduras saturadas em gramas por porção, número>,
  "trans_fat": <gorduras trans em gramas por porção, número>,
  "fiber": <fibra alimentar em gramas por porção, número>,
  "sodium": <sódio em miligramas por porção, número>
}

Forneça estimativas realistas baseadas em composição média de alimentos.`
}

// ─── Helper: Format & Calculate final JSONB ─────────────────────────────────────

function formatNutritionData(parsed: AISchema): NutritionInfo {
  const size = parsed.serving_size_g_ml || 100

  const calc = (val: number, ref: number | null, isEnergy = false): NutrientValue => {
    const per_serving = isEnergy ? Math.round(val) : Math.round(val * 10) / 10
    const per_100g = isEnergy 
      ? Math.round((val / size) * 100) 
      : Math.round(((val / size) * 100) * 10) / 10
    const vd_percent = ref ? Math.round((val / ref) * 100) : null
    return { per_100g, per_serving, vd_percent }
  }

  const kcalVal = parsed.calories || 0
  const kjVal = kcalVal * 4.184

  return {
    serving_size_g_ml: size,
    serving_size_household: parsed.serving_size_household || "1 porção",
    nutrients: {
      energy_kcal: calc(kcalVal, REF_ENERGY_KCAL, true),
      energy_kj: calc(kjVal, REF_ENERGY_KJ, true),
      carbs: calc(parsed.carbs || 0, REF_CARBS),
      total_sugars: calc(parsed.total_sugars || 0, null),
      added_sugars: calc(parsed.added_sugars || 0, REF_ADDED_SUGARS),
      protein: calc(parsed.protein || 0, REF_PROTEIN),
      fat: calc(parsed.fat || 0, REF_FAT),
      saturated_fat: calc(parsed.saturated_fat || 0, REF_SATURATED_FAT),
      trans_fat: calc(parsed.trans_fat || 0, null),
      fiber: calc(parsed.fiber || 0, REF_FIBER),
      sodium: calc(parsed.sodium || 0, REF_SODIUM)
    }
  }
}

// ─── OpenAI call ───────────────────────────────────────────────────────────────

async function callOpenAI(apiKey: string, prompt: string): Promise<NutritionInfo> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Você é um nutricionista especializado. Responda sempre com JSON puro, sem markdown.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 400,
      response_format: { type: 'json_object' }
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`OpenAI API error ${response.status}: ${errText}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error('OpenAI returned empty content')

  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error(`No JSON object found in OpenAI response: ${content}`)

  const parsed = JSON.parse(jsonMatch[0]) as AISchema
  return formatNutritionData(parsed)
}

// ─── Gemini call ───────────────────────────────────────────────────────────────

async function callGemini(apiKey: string, prompt: string): Promise<NutritionInfo> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      systemInstruction: {
        parts: [{ text: 'Você é um nutricionista especializado. Responda sempre APENAS com o JSON puro da tabela nutricional, respeitando estritamente o esquema fornecido.' }]
      },
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            serving_size_g_ml: { type: 'INTEGER', description: 'Peso ou volume estimado de uma porção em g ou ml' },
            serving_size_household: { type: 'STRING', description: 'Medida caseira correspondente à porção' },
            calories: { type: 'NUMBER', description: 'Calorias por porção em kcal' },
            carbs: { type: 'NUMBER', description: 'Carboidratos por porção em gramas' },
            total_sugars: { type: 'NUMBER', description: 'Açúcares totais por porção em gramas' },
            added_sugars: { type: 'NUMBER', description: 'Açúcares adicionados por porção em gramas' },
            protein: { type: 'NUMBER', description: 'Proteínas por porção em gramas' },
            fat: { type: 'NUMBER', description: 'Gorduras totais por porção em gramas' },
            saturated_fat: { type: 'NUMBER', description: 'Gorduras saturadas por porção em gramas' },
            trans_fat: { type: 'NUMBER', description: 'Gorduras trans por porção em gramas' },
            fiber: { type: 'NUMBER', description: 'Fibra alimentar por porção em gramas' },
            sodium: { type: 'NUMBER', description: 'Sódio por porção em miligramas' }
          },
          required: [
            "serving_size_g_ml", "serving_size_household", "calories", "carbs", 
            "total_sugars", "added_sugars", "protein", "fat", "saturated_fat", 
            "trans_fat", "fiber", "sodium"
          ]
        }
      }
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Gemini API error ${response.status}: ${errText}`)
  }

  const data = await response.json()
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!rawText) throw new Error('Gemini returned empty content')

  const jsonMatch = rawText.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error(`No JSON object found in Gemini response: ${rawText}`)

  const parsed = JSON.parse(jsonMatch[0]) as AISchema
  return formatNutritionData(parsed)
}

// ─── Main handler ──────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return createResponse(null, { code: 'UNAUTHORIZED', message: 'Usuário não autenticado' }, 200)
    }

    const { ingredients, servings } = await req.json() as {
      ingredients: Ingredient[]
      servings: number
    }

    if (!ingredients || ingredients.length === 0) {
      return createResponse(null, { code: 'BAD_REQUEST', message: 'Nenhum ingrediente fornecido' }, 200)
    }

    const supabaseService = getServiceClient()
    const { data: settingsRow, error: settingsError } = await supabaseService
      .from('app_settings')
      .select('value_json')
      .eq('setting_key', 'ai_config')
      .single()

    if (settingsError || !settingsRow) {
      return createResponse(null, { code: 'CONFIG_ERROR', message: 'Configuração de IA não encontrada. Configure as API keys.' }, 200)
    }

    const aiConfig = settingsRow.value_json as unknown as AIConfig
    const prompt = buildPrompt(ingredients, servings || 1)

    let result: NutritionInfo | null = null
    let lastError: string = ''

    const providers: Array<'openai' | 'gemini'> = aiConfig.preferred_provider === 'gemini'
      ? ['gemini', 'openai']
      : ['openai', 'gemini']

    for (const provider of providers) {
      try {
        if (provider === 'openai' && aiConfig.openai_api_key) {
          result = await callOpenAI(aiConfig.openai_api_key, prompt)
          break
        } else if (provider === 'gemini' && aiConfig.gemini_api_key) {
          result = await callGemini(aiConfig.gemini_api_key, prompt)
          break
        }
      } catch (err: any) {
        lastError = `${err.message}`
        console.warn(`Provider ${provider} failed, trying fallback...`, err.message)
        continue
      }
    }

    if (!result) {
      return createResponse(null, {
        code: 'AI_ERROR',
        message: `Nenhum provedor de IA disponível. Verifique as API keys. ${lastError ? `Detalhes: ${lastError}` : 'Nenhuma chave foi inserida nas configurações.'}`
      }, 200)
    }

    return createResponse(result)

  } catch (err: any) {
    console.error('generate-nutrition error:', err)
    return createResponse(null, { code: 'INTERNAL_ERROR', message: err.message }, 200)
  }
})
