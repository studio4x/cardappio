import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { getAuthenticatedUser, getServiceClient } from "../_shared/auth.ts"
import { corsHeaders } from "../_shared/cors.ts"
import { createResponse } from "../_shared/response.ts"

/**
 * generate-nutrition
 *
 * Generates a per-serving nutritional table from a recipe's ingredients list.
 * Uses OpenAI GPT as the primary provider, Gemini as automatic fallback.
 *
 * Security:
 * - Requires authenticated admin user
 * - API keys are read from app_settings via service_role (never exposed to client)
 *
 * Request body:
 *   { ingredients: { name: string, quantity_label: string | null, unit: string | null }[], servings: number }
 *
 * Response:
 *   { calories: number, protein: number, fat: number, carbs: number, provider: string }
 */

interface Ingredient {
  name: string
  quantity_label: string | null
  unit: string | null
}

interface NutritionResult {
  calories: number
  protein: number
  fat: number
  carbs: number
  provider: string
}

interface AIConfig {
  openai_api_key: string
  gemini_api_key: string
  preferred_provider: 'openai' | 'gemini'
}

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

Responda APENAS com um JSON válido, sem texto extra, no formato:
{
  "calories": <número inteiro kcal>,
  "protein": <número decimal gramas>,
  "fat": <número decimal gramas>,
  "carbs": <número decimal gramas>
}

Forneça estimativas realistas baseadas em composição média dos alimentos. Se um ingrediente for a gosto ou opcional, ignore-o ou use quantidade mínima.`
}

// ─── OpenAI call ───────────────────────────────────────────────────────────────

async function callOpenAI(apiKey: string, prompt: string): Promise<NutritionResult> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Você é um nutricionista especializado. Responda sempre com JSON puro, sem formatação markdown.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 200,
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

  // Robustly extract JSON object matching {...}
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error(`No JSON object found in OpenAI response: ${content}`)
  }

  const parsed = JSON.parse(jsonMatch[0])
  return {
    calories: Number(parsed.calories) || 0,
    protein: Number(parsed.protein) || 0,
    fat: Number(parsed.fat) || 0,
    carbs: Number(parsed.carbs) || 0,
    provider: 'openai'
  }
}

// ─── Gemini call ───────────────────────────────────────────────────────────────

async function callGemini(apiKey: string, prompt: string): Promise<NutritionResult> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      systemInstruction: {
        parts: [{ text: 'Você é um nutricionista especializado. Responda sempre APENAS com o JSON puro da tabela nutricional, sem markdown, introdução ou explicações.' }]
      },
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json'
      }
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Gemini API error ${response.status}: ${errText}`)
  }

  const data = await response.json()
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!rawText) {
    throw new Error(`Gemini returned empty content. Response: ${JSON.stringify(data)}`)
  }

  // Robustly extract JSON object matching {...}
  const jsonMatch = rawText.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error(`No JSON object found in Gemini response: ${rawText}`)
  }

  const parsed = JSON.parse(jsonMatch[0])

  return {
    calories: Number(parsed.calories) || 0,
    protein: Number(parsed.protein) || 0,
    fat: Number(parsed.fat) || 0,
    carbs: Number(parsed.carbs) || 0,
    provider: 'gemini'
  }
}

// ─── Main handler ──────────────────────────────────────────────────────────────

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Authenticate — must be admin
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return createResponse(null, { code: 'UNAUTHORIZED', message: 'Usuário não autenticado' }, 401)
    }

    // 2. Parse body
    const { ingredients, servings } = await req.json() as {
      ingredients: Ingredient[]
      servings: number
    }

    if (!ingredients || ingredients.length === 0) {
      return createResponse(null, { code: 'BAD_REQUEST', message: 'Nenhum ingrediente fornecido' }, 200)
    }

    // 3. Read AI config from app_settings via service role (never exposed to client)
    const supabaseService = getServiceClient()
    const { data: settingsRow, error: settingsError } = await supabaseService
      .from('app_settings')
      .select('value_json')
      .eq('setting_key', 'ai_config')
      .single()

    if (settingsError || !settingsRow) {
      return createResponse(null, { code: 'CONFIG_ERROR', message: 'Configuração de IA não encontrada. Configure as API keys nas configurações.' }, 200)
    }

    const aiConfig = settingsRow.value_json as unknown as AIConfig
    const prompt = buildPrompt(ingredients, servings || 1)

    // 4. Call preferred provider with fallback
    let result: NutritionResult | null = null
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
    return createResponse(null, { code: 'INTERNAL_ERROR', message: err.message }, 500)
  }
})
