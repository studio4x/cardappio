import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { getAuthenticatedUser, getServiceClient } from "../_shared/auth.ts"
import { corsHeaders } from "../_shared/cors.ts"
import { createResponse } from "../_shared/response.ts"

interface Ingredient {
  name: string
  quantity_label: string | null
  unit: string | null
}

interface ParsedRecipe {
  title: string
  subtitle?: string
  difficulty_level?: 'easy' | 'medium' | 'hard'
  prep_time_minutes?: number
  servings?: number
  category_id?: string | null
  cover_image_url?: string | null
  ingredients: Ingredient[]
  steps: string[]
}

interface AIConfig {
  openai_api_key: string
  gemini_api_key: string
  preferred_provider: 'openai' | 'gemini'
}

// ─── Nutrition types & ANVISA constants ──────────────────────────────────────
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

const REF_ENERGY_KCAL = 2000
const REF_ENERGY_KJ = 8400
const REF_CARBS = 300
const REF_ADDED_SUGARS = 50
const REF_PROTEIN = 50
const REF_FAT = 65
const REF_SATURATED_FAT = 22
const REF_FIBER = 25
const REF_SODIUM = 2000

// ─── Fetch external page ──────────────────────────────────────────────────────
async function fetchRecipePage(urlStr: string): Promise<string> {
  const response = await fetch(urlStr, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    }
  });

  if (!response.ok) {
    throw new Error(`Não foi possível acessar a página de receita. Status: ${response.status}`);
  }

  return await response.text();
}

// ─── Extrair metadados e JSON-LD ──────────────────────────────────────────────
function extractMetadata(html: string): { ogImage: string | null; jsonLdRecipes: any[] } {
  let ogImage: string | null = null;
  
  // Buscar og:image
  const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
                        html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i);
  if (ogImageMatch) {
    ogImage = ogImageMatch[1];
  }

  const jsonLdRecipes: any[] = [];
  const jsonLdRegex = /<script\s+[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;

  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      const content = match[1].trim();
      const parsed = JSON.parse(content);
      
      const items = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of items) {
        if (item['@graph'] && Array.isArray(item['@graph'])) {
          for (const graphItem of item['@graph']) {
            if (graphItem['@type'] === 'Recipe' || (Array.isArray(graphItem['@type']) && graphItem['@type'].includes('Recipe'))) {
              jsonLdRecipes.push(graphItem);
            }
          }
        } else if (item['@type'] === 'Recipe' || (Array.isArray(item['@type']) && item['@type'].includes('Recipe'))) {
          jsonLdRecipes.push(item);
        }
      }
    } catch (e) {
      // Ignorar erros de parse de JSON-LD inválido
    }
  }

  return { ogImage, jsonLdRecipes };
}

// ─── Limpar HTML para economizar tokens ────────────────────────────────────────
function cleanHtml(rawHtml: string): string {
  let cleaned = rawHtml
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '')
    .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '')
    .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\s+class=["'][^"']*["']/gi, '')
    .replace(/\s+id=["'][^"']*["']/gi, '')
    .replace(/\s+style=["'][^"']*["']/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  return cleaned.substring(0, 35000);
}

// ─── OpenAI call ───────────────────────────────────────────────────────────────
async function callOpenAI(apiKey: string, prompt: string): Promise<ParsedRecipe> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Você é um assistente culinário especializado em extrair, estruturar e reescrever receitas de forma inteligente para evitar plágio de direitos autorais. Responda sempre com JSON puro, sem markdown.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 2000,
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

  return JSON.parse(jsonMatch[0]) as ParsedRecipe
}

// ─── Gemini call ───────────────────────────────────────────────────────────────
async function callGemini(apiKey: string, prompt: string): Promise<ParsedRecipe> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      systemInstruction: {
        parts: [{ text: 'Você é um assistente culinário especializado em extrair, estruturar e reescrever receitas de forma inteligente para evitar plágio de direitos autorais. Responda sempre APENAS com o JSON puro da receita estruturada, respeitando estritamente o esquema fornecido.' }]
      },
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Título da receita reescrito de forma atraente e original' },
            subtitle: { type: 'string', description: 'Uma breve descrição da receita de forma amigável e original' },
            difficulty_level: { type: 'string', enum: ['easy', 'medium', 'hard'], description: 'Nível de dificuldade da receita' },
            prep_time_minutes: { type: 'integer', description: 'Tempo total de preparo em minutos' },
            servings: { type: 'integer', description: 'Quantidade de porções ou rendimento' },
            category_id: { type: 'string', description: 'UUID da categoria mais adequada a partir da lista fornecida' },
            cover_image_url: { type: 'string', description: 'A URL de imagem da receita mais apropriada se encontrada' },
            ingredients: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string', description: 'Nome do ingrediente' },
                  quantity_label: { type: 'string', description: 'Quantidade, ex: 1, 1/2, a gosto' },
                  unit: { type: 'string', description: 'Unidade de medida, ex: colher de sopa, xícara, g, ml, unidade' }
                },
                required: ['name']
              }
            },
            steps: {
              type: 'array',
              items: { type: 'string' },
              description: 'Passos ordenados do modo de preparo, reescritos em tom amigável'
            }
          },
          required: ['title', 'difficulty_level', 'prep_time_minutes', 'servings', 'ingredients', 'steps']
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
    throw new Error('Gemini returned empty content')
  }

  const jsonMatch = rawText.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error(`No JSON object found in Gemini response: ${rawText}`)
  }

  return JSON.parse(jsonMatch[0]) as ParsedRecipe
}

// ─── Nutrition helpers (inline from generate-nutrition) ──────────────────────
function buildNutritionPrompt(ingredients: Ingredient[], servings: number): string {
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
  "serving_size_g_ml": <número inteiro>,
  "serving_size_household": "<medida caseira>",
  "calories": <número>,
  "carbs": <número>,
  "total_sugars": <número>,
  "added_sugars": <número>,
  "protein": <número>,
  "fat": <número>,
  "saturated_fat": <número>,
  "trans_fat": <número>,
  "fiber": <número>,
  "sodium": <número>
}

Forneça estimativas realistas baseadas em composição média de alimentos.`
}

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
    serving_size_household: parsed.serving_size_household || '1 porção',
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

async function generateNutritionInternal(
  ingredients: Ingredient[],
  servings: number,
  aiConfig: AIConfig
): Promise<NutritionInfo | null> {
  const prompt = buildNutritionPrompt(ingredients, servings)
  const providers: Array<'openai' | 'gemini'> = aiConfig.preferred_provider === 'gemini'
    ? ['gemini', 'openai']
    : ['openai', 'gemini']

  for (const provider of providers) {
    try {
      if (provider === 'openai' && aiConfig.openai_api_key) {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${aiConfig.openai_api_key}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: 'Você é um nutricionista especializado. Responda sempre com JSON puro, sem markdown.' },
              { role: 'user', content: prompt }
            ],
            temperature: 0.3,
            max_tokens: 400,
            response_format: { type: 'json_object' }
          })
        })
        if (!res.ok) throw new Error(`OpenAI ${res.status}`)
        const d = await res.json()
        const content = d.choices?.[0]?.message?.content
        const match = content?.match(/\{[\s\S]*\}/)
        if (match) return formatNutritionData(JSON.parse(match[0]) as AISchema)
      } else if (provider === 'gemini' && aiConfig.gemini_api_key) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${aiConfig.gemini_api_key}`
        const res = await fetch(url, {
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
          })
        })
        if (!res.ok) throw new Error(`Gemini ${res.status}`)
        const d = await res.json()
        const rawText = d.candidates?.[0]?.content?.parts?.[0]?.text
        const match = rawText?.match(/\{[\s\S]*\}/)
        if (match) return formatNutritionData(JSON.parse(match[0]) as AISchema)
      }
    } catch (err) {
      console.warn(`Nutrition provider ${provider} failed:`, err)
    }
  }
  return null
}

// ─── Build prompt ─────────────────────────────────────────────────────────────
function buildRecipeExtractionPrompt(
  url: string,
  categories: { id: string; name: string }[],
  ogImage: string | null,
  jsonLd: any | null,
  cleanedHtml: string
): string {
  const categoriesList = categories.map(c => `- ID: "${c.id}" | Nome: "${c.name}"`).join('\n');
  const imageInfo = ogImage ? `Imagem sugerida extraída dos metadados: "${ogImage}"` : 'Nenhuma imagem sugerida encontrada.';
  
  let sourceData = '';
  if (jsonLd) {
    sourceData = `Dados estruturados JSON-LD de Receita encontrados:\n${JSON.stringify(jsonLd, null, 2)}`;
  } else {
    sourceData = `HTML limpo da página:\n${cleanedHtml}`;
  }

  return `Você é um assistente culinário especializado em extrair, estruturar e reescrever receitas a partir do conteúdo de um site.
URL da receita original: ${url}
${imageInfo}

Categorias válidas no banco de dados (escolha rigorosamente o ID da categoria culinária que melhor se encaixa, ou retorne null/não defina se nenhuma for apropriada):
${categoriesList}

DADOS DA PÁGINA FONTE:
${sourceData}

INSTRUÇÕES IMPORTANTES:
1. Extraia o título da receita e reescreva-o de forma original, gourmet e atraente.
2. Escreva uma breve descrição original (subtitle) em tom comercial.
3. Estime o tempo de preparo (prep_time_minutes) e porções (servings) com base nas informações encontradas na página.
4. Identifique o nível de dificuldade (difficulty_level): 'easy', 'medium' ou 'hard'.
5. Selecione a melhor imagem para cover_image_url. Se você encontrar uma imagem de alta resolução nos dados, use-a. Se não, use a imagem sugerida fornecida acima.
6. Extraia a lista de ingredientes. Normalize-os e separe em:
   - "name": Nome do ingrediente (ex: "farinha de trigo", "leite integral").
   - "quantity_label": Quantidade como string (ex: "1", "1/2", "200", "a gosto"). Pode ser null se não houver.
   - "unit": Unidade de medida (ex: "xícara de chá", "g", "ml", "unidade", "colher de sopa", "dente", "colher de chá"). Pode ser null se não houver.
7. Reescreva o modo de preparo (steps) como um array de etapas claras e sequenciais, mudando as palavras levemente para evitar direitos autorais/plágio, mas mantendo a técnica culinária perfeitamente precisa.
8. Escolha o category_id mais apropriado dentre as categorias fornecidas.

Responda APENAS com um JSON válido no formato exato:
{
  "title": "Nome da Receita",
  "subtitle": "Breve descrição",
  "difficulty_level": "easy",
  "prep_time_minutes": 30,
  "servings": 4,
  "category_id": "UUID da categoria selecionada ou null",
  "cover_image_url": "URL da Imagem ou null",
  "ingredients": [
    { "name": "Ingrediente", "quantity_label": "quantidade ou null", "unit": "unidade ou null" }
  ],
  "steps": [
    "Passo 1...",
    "Passo 2..."
  ]
}`;
}

// ─── Main serve handler ───────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Authenticate user
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return createResponse(null, { code: 'UNAUTHORIZED', message: 'You must be logged in' }, 401)
    }

    // 2. Validate input
    const { url } = await req.json()
    if (!url) {
      return createResponse(null, { code: 'BAD_REQUEST', message: 'URL is required' }, 400)
    }

    const supabaseAdmin = getServiceClient()

    // 3. Fetch AI configuration
    const { data: settingsRow, error: settingsError } = await supabaseAdmin
      .from('app_settings')
      .select('value_json')
      .eq('setting_key', 'ai_config')
      .single()

    if (settingsError || !settingsRow) {
      return createResponse(null, { code: 'CONFIG_ERROR', message: 'Configuração de IA não encontrada. Configure as API keys.' }, 400)
    }

    const aiConfig = settingsRow.value_json as unknown as AIConfig

    // 4. Fetch active recipe categories
    const { data: categories, error: catError } = await supabaseAdmin
      .from('recipe_categories')
      .select('id, name, slug')
      .eq('is_active', true)

    if (catError) {
      console.error('Error fetching categories:', catError)
    }

    // 5. Fetch page html & extract data
    console.log(`Fetching recipe from: ${url}`)
    const html = await fetchRecipePage(url)
    const { ogImage, jsonLdRecipes } = extractMetadata(html)
    
    let sourceJsonLd: any = null;
    let cleanedHtml = '';

    if (jsonLdRecipes.length > 0) {
      sourceJsonLd = jsonLdRecipes[0];
      console.log('JSON-LD recipe data found and selected.');
    } else {
      cleanedHtml = cleanHtml(html);
      console.log('No JSON-LD recipe found. Cleaned HTML size:', cleanedHtml.length);
    }

    // 6. Build prompt and invoke AI
    const prompt = buildRecipeExtractionPrompt(
      url, 
      categories || [], 
      ogImage, 
      sourceJsonLd, 
      cleanedHtml
    );

    let result: ParsedRecipe | null = null;
    const errors: string[] = [];

    const providers: Array<'openai' | 'gemini'> = aiConfig.preferred_provider === 'gemini'
      ? ['gemini', 'openai']
      : ['openai', 'gemini']

    for (const provider of providers) {
      try {
        console.log(`Trying AI Provider: ${provider}`)
        if (provider === 'openai') {
          if (aiConfig.openai_api_key) {
            result = await callOpenAI(aiConfig.openai_api_key, prompt)
            break
          } else {
            errors.push('OpenAI: API Key not configured.')
          }
        } else if (provider === 'gemini') {
          if (aiConfig.gemini_api_key) {
            result = await callGemini(aiConfig.gemini_api_key, prompt)
            break
          } else {
            errors.push('Gemini: API Key not configured.')
          }
        }
      } catch (err: any) {
        errors.push(`${provider}: ${err.message}`)
        console.warn(`Provider ${provider} failed, trying fallback...`, err.message)
      }
    }

    if (!result) {
      return createResponse(null, {
        code: 'AI_ERROR',
        message: `Nenhum provedor de IA disponível para realizar a importação. Detalhes dos erros:\n${errors.join('\n')}`
      }, 400)
    }

    // 7. Insert recipe
    const slug = (result.title || "receita-importada")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') + '-' + Math.random().toString(36).substring(2, 7)

    const { data: recipe, error: recipeError } = await supabaseAdmin
      .from('recipes')
      .insert({
        title: result.title,
        subtitle: result.subtitle || null,
        slug,
        prep_time_minutes: result.prep_time_minutes || 30,
        servings: result.servings || 4,
        difficulty_level: result.difficulty_level || 'easy',
        status: 'published',
        created_by: user.id,
        is_premium: false,
        cover_image_url: result.cover_image_url || ogImage || null,
        category_id: result.category_id || null
      })
      .select()
      .single()

    if (recipeError) {
      console.error('Error inserting recipe:', recipeError)
      return createResponse(null, { code: 'DATABASE_ERROR', message: recipeError.message }, 400)
    }

    // 8. Insert ingredients
    if (result.ingredients && result.ingredients.length > 0) {
      const ingredientsToInsert = result.ingredients.map((ing, idx) => ({
        recipe_id: recipe.id,
        name: ing.name,
        quantity_label: ing.quantity_label || null,
        unit: ing.unit || null,
        normalized_name: ing.name.toLowerCase().trim(),
        sort_order: idx
      }))

      const { error: ingError } = await supabaseAdmin
        .from('recipe_ingredients')
        .insert(ingredientsToInsert)

      if (ingError) {
        console.error('Error inserting ingredients:', ingError)
        return createResponse(null, { code: 'DATABASE_ERROR', message: ingError.message }, 400)
      }
    }

    // 9. Insert steps
    if (result.steps && result.steps.length > 0) {
      const stepsToInsert = result.steps.map((content, idx) => ({
        recipe_id: recipe.id,
        step_number: idx + 1,
        content
      }))

      const { error: stepsError } = await supabaseAdmin
        .from('recipe_steps')
        .insert(stepsToInsert)

      if (stepsError) {
        console.error('Error inserting steps:', stepsError)
        return createResponse(null, { code: 'DATABASE_ERROR', message: stepsError.message }, 400)
      }
    }

    // 10. Auto-generate nutrition (best-effort — does not block the response)
    if (result.ingredients && result.ingredients.length > 0) {
      try {
        console.log('Generating nutrition for imported recipe...')
        const nutritionInfo = await generateNutritionInternal(
          result.ingredients,
          result.servings || 4,
          aiConfig
        )
        if (nutritionInfo) {
          await supabaseAdmin
            .from('recipes')
            .update({ nutrition_info: nutritionInfo })
            .eq('id', recipe.id)
          console.log('Nutrition saved successfully for recipe:', recipe.id)
        }
      } catch (nutritionErr) {
        console.warn('Auto-nutrition failed (non-blocking):', nutritionErr)
      }
    }

    return createResponse({
      recipe_id: recipe.id,
      slug: recipe.slug,
      title: recipe.title
    })

  } catch (err: any) {
    console.error('Unexpected error in external recipe import:', err)
    return createResponse(null, { code: 'INTERNAL_ERROR', message: err.message }, 500)
  }
})
