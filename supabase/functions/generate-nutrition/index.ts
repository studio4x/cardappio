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

function buildPrompt(ingredients: Ingredient[], servings: number, tacoReferences?: string): string {
  const ingredientList = ingredients
    .map(i => {
      const qty = i.quantity_label ? i.quantity_label : ''
      const unit = i.unit ? i.unit : ''
      return `- ${i.name}${qty || unit ? `: ${qty} ${unit}`.trim() : ''}`
    })
    .join('\n')

  let prompt = `Você é um nutricionista especialista em rotulagem de alimentos no Brasil.
Analise a lista de ingredientes abaixo de uma receita que rende ${servings} porção(ões).

Ingredientes:
${ingredientList}
`

  if (tacoReferences) {
    prompt += `
DADOS DE REFERÊNCIA REAL DA TABELA TACO (Use estes valores por 100g para calcular proporcionalmente sempre que aplicável):
${tacoReferences}
`
  }

  prompt += `
INSTRUÇÕES DE CÁLCULO (Siga rigorosamente):
1. Converta cada ingrediente e sua medida caseira para gramas (g) ou mililitros (ml) de parte comestível pronta para consumo.
2. Calcule proporcionalmente a quantidade de calorias, carboidratos, proteínas, gorduras totais, gorduras saturadas, fibras e sódio por ingrediente com base nas referências da TACO fornecidas.
3. Somar todos os ingredientes calculados para obter o total da receita e dividir pelo número de porções (${servings}) para obter o valor unitário por porção.
4. Garanta o balanço de macronutrientes: Calorias (kcal) = (carboidratos * 4) + (proteínas * 4) + (gorduras totais * 9).

Responda APENAS com um JSON válido, sem tags markdown ou texto extra, no formato exato:
{
  "serving_size_g_ml": <peso ou volume estimado de uma única porção pronta em g ou ml, número inteiro>,
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
}`

  return prompt
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
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object',
          properties: {
            serving_size_g_ml: { type: 'integer', description: 'Peso ou volume estimado de uma porção em g ou ml' },
            serving_size_household: { type: 'string', description: 'Medida caseira correspondente à porção' },
            calories: { type: 'number', description: 'Calorias por porção em kcal' },
            carbs: { type: 'number', description: 'Carboidratos por porção em gramas' },
            total_sugars: { type: 'number', description: 'Açúcares totais por porção em gramas' },
            added_sugars: { type: 'number', description: 'Açúcares adicionados por porção em gramas' },
            protein: { type: 'number', description: 'Proteínas por porção em gramas' },
            fat: { type: 'number', description: 'Gorduras totais por porção em gramas' },
            saturated_fat: { type: 'number', description: 'Gorduras saturadas por porção em gramas' },
            trans_fat: { type: 'number', description: 'Gorduras trans por porção em gramas' },
            fiber: { type: 'number', description: 'Fibra alimentar por porção em gramas' },
            sodium: { type: 'number', description: 'Sódio por porção em miligramas' }
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
  const candidate = data.candidates?.[0]
  const rawText = candidate?.content?.parts?.[0]?.text
  
  if (!rawText) {
    console.error('Gemini candidates info:', JSON.stringify(data.candidates))
    throw new Error('Gemini returned empty content')
  }

  const jsonMatch = rawText.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    console.error('Gemini raw text:', rawText)
    console.error('Gemini finish reason:', candidate?.finishReason)
    console.error('Gemini safety ratings:', JSON.stringify(candidate?.safetyRatings))
    throw new Error(`No JSON object found in Gemini response: ${rawText}`)
  }

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

    // Resolve TACO reference values for ingredients
    let tacoReferences = ''
    try {
      const referenceItems: string[] = []
      for (const ing of ingredients) {
        // Clean name and split into search keywords (e.g. filter out stop words and quantities)
        const cleanedName = ing.name
          .replace(/[0-9]+/g, '')
          .replace(/(colher|xícara|gramas|chá|sopa|sobremesa|copo|dente|fatia|unidade|de|do|da|com|sem|para|a|o)/gi, '')
          .trim()
        const searchWords = cleanedName.split(/[\s,]+/).filter(w => w.length > 2)
        if (searchWords.length > 0) {
          let query = supabaseService.from('taco_foods').select('*')
          query = query.ilike('description', `%${searchWords[0]}%`)
          
          const { data: matchedFoods } = await query.limit(3)
          if (matchedFoods && matchedFoods.length > 0) {
            matchedFoods.forEach(food => {
              referenceItems.push(
                `- Ingrediente "${ing.name}" pode corresponder a: "${food.description}" da TACO (Categoria: ${food.category}). Valores por 100g: Energia: ${food.energy_kcal}kcal, Proteína: ${food.protein_g}g, Carboidrato: ${food.carbohydrate_g}g, Lipídeos: ${food.lipid_g}g, Sódio: ${food.sodium_mg}mg, Fibra: ${food.fiber_g}g`
              );
            });
          }
        }
      }
      if (referenceItems.length > 0) {
        tacoReferences = referenceItems.join('\n')
      }
    } catch (lookupErr) {
      console.warn('Erro ao consultar banco TACO local:', lookupErr.message)
    }

    const aiConfig = settingsRow.value_json as unknown as AIConfig
    const prompt = buildPrompt(ingredients, servings || 1, tacoReferences)

    let result: NutritionInfo | null = null
    const errors: string[] = []

    const providers: Array<'openai' | 'gemini'> = aiConfig.preferred_provider === 'gemini'
      ? ['gemini', 'openai']
      : ['openai', 'gemini']

    for (const provider of providers) {
      try {
        if (provider === 'openai') {
          if (aiConfig.openai_api_key) {
            result = await callOpenAI(aiConfig.openai_api_key, prompt)
            break
          } else {
            errors.push('OpenAI: Chave API não configurada.')
          }
        } else if (provider === 'gemini') {
          if (aiConfig.gemini_api_key) {
            result = await callGemini(aiConfig.gemini_api_key, prompt)
            break
          } else {
            errors.push('Gemini: Chave API não configurada.')
          }
        }
      } catch (err: any) {
        errors.push(`${provider === 'openai' ? 'OpenAI' : 'Gemini'}: ${err.message}`)
        console.warn(`Provider ${provider} failed, trying fallback...`, err.message)
      }
    }

    if (!result) {
      return createResponse(null, {
        code: 'AI_ERROR',
        message: `Nenhum provedor de IA disponível ou funcional. Detalhes dos erros:\n${errors.join('\n')}`
      }, 200)
    }

    return createResponse(result)

  } catch (err: any) {
    console.error('generate-nutrition error:', err)
    return createResponse(null, { code: 'INTERNAL_ERROR', message: err.message }, 200)
  }
})
