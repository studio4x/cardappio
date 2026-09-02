import { DEFAULT_MEASUREMENT_UNITS_DATA } from '@/hooks/recipes/useMeasurementUnits'

export type RecipeJsonDifficulty = 'easy' | 'medium' | 'hard'
export type RecipeJsonCost = 'low' | 'medium' | 'high'
export type RecipeJsonTagType = 'diet' | 'difficulty' | 'budget' | 'context' | 'family'
export type RecipeJsonStatus = 'draft' | 'published' | 'archived'

export interface AdminRecipeJsonImportResult {
  title: string
  subtitle: string | null
  slug: string
  category_name: string | null
  category_slug: string | null
  cover_image_url: string | null
  cover_image_prompt: string
  difficulty_level: RecipeJsonDifficulty
  cost_level: RecipeJsonCost
  prep_time_minutes: number
  servings: number
  usage_context: string | null
  notes: string | null
  status: RecipeJsonStatus
  is_featured: boolean
  is_premium: boolean
  published_at: string | null
  tags: Array<{
    name: string
    slug: string
    tag_type: RecipeJsonTagType
  }>
  ingredients: Array<{
    name: string
    quantity_label: string | null
    unit: string | null
    normalized_name: string | null
    sort_order: number
    is_optional: boolean
  }>
  steps: Array<{
    step_number: number
    content: string
  }>
  warnings: string[]
}

interface ParseResult {
  data: AdminRecipeJsonImportResult | null
  errors: string[]
}

interface PlainObject {
  [key: string]: unknown
}

const DIFFICULTY_VALUES: RecipeJsonDifficulty[] = ['easy', 'medium', 'hard']
const COST_VALUES: RecipeJsonCost[] = ['low', 'medium', 'high']
const TAG_TYPE_VALUES: RecipeJsonTagType[] = ['diet', 'difficulty', 'budget', 'context', 'family']
const STATUS_VALUES: RecipeJsonStatus[] = ['draft', 'published', 'archived']

function isPlainObject(value: unknown): value is PlainObject {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function toText(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  return ''
}

function toOptionalText(value: unknown): string | null {
  const text = toText(value)
  return text ? text : null
}

function toInt(value: unknown, fallback: number, min = 0): number {
  const parsed = typeof value === 'number' ? value : Number.parseInt(toText(value), 10)
  if (!Number.isFinite(parsed)) return fallback
  return Math.max(min, Math.trunc(parsed))
}

function toBool(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (['true', '1', 'yes', 'sim'].includes(normalized)) return true
    if (['false', '0', 'no', 'nao', 'não'].includes(normalized)) return false
  }
  return fallback
}

function slugify(value: string): string {
  const normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')

  return normalized || 'recipe'
}

function normalizeKeyText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
}

function humanizeSlug(value: string): string {
  const text = value
    .replace(/[-_]+/g, ' ')
    .trim()

  if (!text) return ''

  return text
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function stripCodeFence(raw: string): string {
  const trimmed = raw.trim()
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)
  if (fenced?.[1]) return fenced[1].trim()
  return trimmed
}

function extractLikelyJson(raw: string): string {
  const firstBrace = raw.indexOf('{')
  const lastBrace = raw.lastIndexOf('}')
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) return raw
  return raw.slice(firstBrace, lastBrace + 1).trim()
}

function normalizeDifficulty(value: unknown): RecipeJsonDifficulty {
  const candidate = toText(value).toLowerCase()
  return DIFFICULTY_VALUES.includes(candidate as RecipeJsonDifficulty)
    ? (candidate as RecipeJsonDifficulty)
    : 'easy'
}

function normalizeCost(value: unknown): RecipeJsonCost {
  const candidate = toText(value).toLowerCase()
  return COST_VALUES.includes(candidate as RecipeJsonCost)
    ? (candidate as RecipeJsonCost)
    : 'medium'
}

function normalizeStatus(value: unknown): RecipeJsonStatus {
  const candidate = toText(value).toLowerCase()
  return STATUS_VALUES.includes(candidate as RecipeJsonStatus)
    ? (candidate as RecipeJsonStatus)
    : 'draft'
}

function normalizeTagType(value: unknown): RecipeJsonTagType {
  const candidate = toText(value).toLowerCase()
  return TAG_TYPE_VALUES.includes(candidate as RecipeJsonTagType)
    ? (candidate as RecipeJsonTagType)
    : 'context'
}

function normalizeDate(value: unknown): string | null {
  const text = toText(value)
  if (!text) return null
  const date = new Date(text)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function normalizeQuantityLabel(item: PlainObject): string | null {
  const explicit = toOptionalText(item.quantity_label)
  if (explicit) return explicit

  const quantity = toOptionalText(item.quantity)
  const unit = toOptionalText(item.unit)

  if (quantity && unit) return `${quantity} ${unit}`.trim()
  if (quantity) return quantity
  return null
}

function normalizeNormalizedName(name: string, value: unknown): string | null {
  const explicit = toOptionalText(value)
  if (explicit) return normalizeKeyText(explicit)
  return normalizeKeyText(name) || null
}

function normalizeIngredients(rawIngredients: unknown): AdminRecipeJsonImportResult['ingredients'] {
  if (!Array.isArray(rawIngredients)) return []

  return rawIngredients
    .map((item, index) => {
      if (typeof item === 'string') {
        const name = item.trim()
        if (!name) return null

        return {
          name,
          quantity_label: null,
          unit: null,
          normalized_name: normalizeKeyText(name),
          sort_order: index + 1,
          is_optional: false,
        }
      }

      if (!isPlainObject(item)) return null

      const name = toText(item.name)
      if (!name) return null

      return {
        name,
        quantity_label: normalizeQuantityLabel(item),
        unit: toOptionalText(item.unit),
        normalized_name: normalizeNormalizedName(name, item.normalized_name),
        sort_order: toInt(item.sort_order, index + 1, 1),
        is_optional: toBool(item.is_optional, false),
      }
    })
    .filter((item): item is AdminRecipeJsonImportResult['ingredients'][number] => item !== null)
}

function normalizeSteps(rawSteps: unknown): AdminRecipeJsonImportResult['steps'] {
  if (!Array.isArray(rawSteps)) return []

  return rawSteps
    .map((item, index) => {
      if (typeof item === 'string') {
        const content = item.trim()
        if (!content) return null
        return {
          step_number: index + 1,
          content,
        }
      }

      if (!isPlainObject(item)) return null

      const content = toText(item.content || item.step || item.instruction)
      if (!content) return null

      return {
        step_number: toInt(item.step_number, index + 1, 1),
        content,
      }
    })
    .filter((item): item is AdminRecipeJsonImportResult['steps'][number] => item !== null)
}

function normalizeTags(rawTags: unknown): AdminRecipeJsonImportResult['tags'] {
  if (!Array.isArray(rawTags)) return []

  const seen = new Set<string>()

  return rawTags
    .map((item) => {
      if (typeof item === 'string') {
        const name = item.trim()
        if (!name) return null
        const slug = slugify(name)
        return {
          name,
          slug,
          tag_type: 'context' as RecipeJsonTagType,
        }
      }

      if (!isPlainObject(item)) return null

      const name = toText(item.name) || humanizeSlug(toText(item.slug))
      if (!name) return null

      const slug = slugify(toText(item.slug) || name)
      return {
        name,
        slug,
        tag_type: normalizeTagType(item.tag_type),
      }
    })
    .filter((item): item is AdminRecipeJsonImportResult['tags'][number] => {
      if (!item) return false
      if (seen.has(item.slug)) return false
      seen.add(item.slug)
      return true
    })
}

const UNIT_ALIAS_GROUPS: Array<{ aliases: string[]; targets: string[] }> = [
  // Peso
  {
    aliases: ['kg', 'quilo', 'quilos', 'quilograma', 'quilogramas', 'kilo', 'kilos'],
    targets: ['kg', 'quilo', 'quilos', 'g'],
  },
  {
    aliases: ['g', 'grama', 'gramas'],
    targets: ['g', 'grama', 'gramas'],
  },
  {
    aliases: ['mg', 'miligrama', 'miligramas', 'milligrama', 'milligramas'],
    targets: ['mg', 'miligrama', 'milligrama', 'miligramas', 'milligramas'],
  },

  // Volume
  {
    aliases: ['ml', 'mililitro', 'mililitros', 'millilitro', 'millilitros'],
    targets: ['ml', 'mililitro', 'millilitro', 'mililitros', 'millilitros'],
  },
  {
    aliases: ['l', 'litro', 'litros', 'liter'],
    targets: ['l', 'litro', 'litros', 'liter'],
  },
  {
    aliases: ['cl', 'centilitro', 'centilitros'],
    targets: ['cl', 'centilitro', 'centilitros'],
  },
  {
    aliases: ['dl', 'decilitro', 'decilitros'],
    targets: ['dl', 'decilitro', 'decilitros'],
  },

  // Unidades e contagens
  {
    aliases: ['unidade', 'unidades', 'un', 'un.', 'unid', 'unid.'],
    targets: ['unidade', 'unidades'],
  },
  {
    aliases: ['dente', 'dentes'],
    targets: ['dente', 'dentes'],
  },
  {
    aliases: ['fatia', 'fatias'],
    targets: ['fatia', 'fatias'],
  },
  {
    aliases: ['folha', 'folhas'],
    targets: ['folha', 'folhas'],
  },
  {
    aliases: ['maço', 'maços', 'maco', 'macos'],
    targets: ['maço', 'maços'],
  },
  {
    aliases: ['molho', 'molhos'],
    targets: ['molho', 'molhos'],
  },
  {
    aliases: ['pedaço', 'pedaços', 'pedaco', 'pedacos'],
    targets: ['pedaço', 'pedaços'],
  },
  {
    aliases: ['ramo', 'ramos'],
    targets: ['ramo', 'ramos'],
  },
  {
    aliases: ['talo', 'talos'],
    targets: ['talo', 'talos'],
  },
  {
    aliases: ['tablete', 'tabletes'],
    targets: ['tablete', 'tabletes'],
  },

  // Colheres
  {
    aliases: [
      'colher (sopa)',
      'colheres (sopa)',
      'colher de sopa',
      'colheres de sopa',
      'c. sopa',
      'c.sopa',
      'cs',
    ],
    targets: ['colher (sopa)', 'colher de sopa', 'colheres (sopa)', 'colheres de sopa'],
  },
  {
    aliases: [
      'colher (chá)',
      'colheres (chá)',
      'colher de chá',
      'colheres de chá',
      'colher de cha',
      'colheres de cha',
      'c. chá',
      'c. cha',
    ],
    targets: ['colher (chá)', 'colher de chá', 'colheres (chá)', 'colheres de chá'],
  },
  {
    aliases: [
      'colher (sobremesa)',
      'colheres (sobremesa)',
      'colher de sobremesa',
      'colheres de sobremesa',
      'c. sobremesa',
      'c.sobremesa',
    ],
    targets: ['colher (sobremesa)', 'colher de sobremesa', 'colheres (sobremesa)', 'colheres de sobremesa'],
  },
  {
    aliases: [
      'colher (café)',
      'colheres (café)',
      'colher de café',
      'colheres de café',
      'colher de cafe',
      'colheres de cafe',
      'c. café',
      'c. cafe',
    ],
    targets: ['colher (café)', 'colher de café', 'colheres (café)', 'colheres de café'],
  },

  // Recipientes / Copos / Xícaras
  {
    aliases: [
      'xícara (chá)',
      'xícaras (chá)',
      'xicara (cha)',
      'xicaras (cha)',
      'xícara de chá',
      'xícaras de chá',
      'xicara de cha',
      'xicaras de cha',
      'xícara',
      'xícaras',
      'xicara',
      'xicaras',
    ],
    targets: ['xícara (chá)', 'xícara de chá', 'xícara', 'xícaras (chá)', 'xícaras'],
  },
  {
    aliases: ['copo', 'copos'],
    targets: ['copo', 'copos'],
  },
  {
    aliases: ['lata', 'latas'],
    targets: ['lata', 'latas'],
  },
  {
    aliases: ['caixa', 'caixas'],
    targets: ['caixa', 'caixas'],
  },
  {
    aliases: ['pacote', 'pacotes'],
    targets: ['pacote', 'pacotes'],
  },
  {
    aliases: ['vidro', 'vidros'],
    targets: ['vidro', 'vidros'],
  },

  // Medidas
  {
    aliases: ['cm', 'centímetro', 'centímetros', 'centimetro', 'centimetros'],
    targets: ['cm', 'centímetro', 'centímetros'],
  },
  {
    aliases: ['mm', 'milímetro', 'milímetros', 'milimetro', 'milimetros'],
    targets: ['mm', 'milímetro', 'milímetros'],
  },

  // Geral
  {
    aliases: ['a gosto', 'quanto baste', 'q.b.', 'qb'],
    targets: ['a gosto', 'quanto baste'],
  },
  {
    aliases: ['pitada', 'pitadas'],
    targets: ['pitada', 'pitadas'],
  },
  {
    aliases: ['porção', 'porções', 'porcao', 'porcoes'],
    targets: ['porção', 'porções'],
  },
]

function matchActiveUnit(unitText: string, activeSymbols: string[]): string | null {
  const clean = unitText.trim().toLowerCase()
  if (activeSymbols.includes(clean)) return clean

  for (const group of UNIT_ALIAS_GROUPS) {
    if (group.aliases.includes(clean)) {
      const foundActive = group.targets.find((target) => activeSymbols.includes(target))
      if (foundActive) return foundActive
      return group.targets[0]
    }
  }

  return null
}

export function parseAdminRecipeJson(raw: string, activeUnits?: string[]): ParseResult {
  const errors: string[] = []

  if (!raw.trim()) {
    return {
      data: null,
      errors: ['Cole um JSON válido antes de importar.'],
    }
  }

  const stripped = extractLikelyJson(stripCodeFence(raw))

  let parsed: unknown
  try {
    parsed = JSON.parse(stripped)
  } catch {
    try {
      parsed = JSON.parse(extractLikelyJson(stripped))
    } catch {
      return {
        data: null,
        errors: ['O conteúdo não é um JSON válido ou está mal formatado.'],
      }
    }
  }

  if (!isPlainObject(parsed)) {
    return {
      data: null,
      errors: ['O JSON precisa ser um objeto na raiz.'],
    }
  }

  const title = toText(parsed.title)
  if (!title) errors.push('Campo "title" é obrigatório.')

  const slugSource = toText(parsed.slug) || title
  const categoryName = toOptionalText(parsed.category_name)
  const categorySlugSource = toText(parsed.category_slug) || categoryName || ''
  const categorySlug = categorySlugSource ? slugify(categorySlugSource) : null
  const coverImageUrl = toOptionalText(parsed.cover_image_url)
  const coverImagePrompt = toText(parsed.cover_image_prompt)

  const ingredients = normalizeIngredients(parsed.ingredients)
  const steps = normalizeSteps(parsed.steps)
  const tags = normalizeTags(parsed.tags)

  if (ingredients.length === 0) {
    errors.push('O JSON precisa conter ao menos um ingrediente válido.')
  }

  if (steps.length === 0) {
    errors.push('O JSON precisa conter ao menos um passo válido.')
  }

  // Validate and normalize units
  const fallbackActiveSymbols = DEFAULT_MEASUREMENT_UNITS_DATA.map(u => u.symbol)
  const allowedUnits = activeUnits && activeUnits.length > 0 ? activeUnits : fallbackActiveSymbols

  ingredients.forEach((ing) => {
    if (ing.unit) {
      const mappedUnit = matchActiveUnit(ing.unit, allowedUnits)
      if (mappedUnit) {
        ing.unit = mappedUnit
      } else {
        errors.push(
          `A unidade de medida "${ing.unit}" do ingrediente "${ing.name}" não é válida ou não está ativa no sistema.`
        )
      }
    }
  })

  const warnings: string[] = []

  if (!categoryName && !categorySlug) {
    warnings.push('Nenhuma categoria foi informada; a receita será importada sem categoria.')
  }

  if (!coverImageUrl && !coverImagePrompt) {
    warnings.push('Nenhuma imagem ou prompt de imagem foi informado.')
  }

  if (coverImagePrompt) {
    warnings.push('O campo cover_image_prompt será ignorado na importação porque o banco atual não possui coluna para persistir esse dado.')
  }

  const result: AdminRecipeJsonImportResult = {
    title,
    subtitle: toOptionalText(parsed.subtitle),
    slug: slugify(slugSource),
    category_name: categoryName,
    category_slug: categorySlug,
    cover_image_url: coverImageUrl,
    cover_image_prompt: coverImagePrompt,
    difficulty_level: normalizeDifficulty(parsed.difficulty_level),
    cost_level: normalizeCost(parsed.cost_level),
    prep_time_minutes: toInt(parsed.prep_time_minutes, 30, 1),
    servings: toInt(parsed.servings, 4, 1),
    usage_context: toOptionalText(parsed.usage_context),
    notes: toOptionalText(parsed.notes),
    status: normalizeStatus(parsed.status),
    is_featured: toBool(parsed.is_featured, false),
    is_premium: toBool(parsed.is_premium, false),
    published_at: normalizeDate(parsed.published_at),
    tags,
    ingredients,
    steps,
    warnings,
  }

  return {
    data: errors.length > 0 ? null : result,
    errors,
  }
}

export function buildAdminRecipeJsonExample(): string {
  return JSON.stringify(
    {
      title: 'Salpicão de Frango',
      subtitle: 'Cremoso, colorido e pronto para a festa',
      slug: 'salpicao-de-frango',
      category_name: 'Aves',
      category_slug: 'aves',
      cover_image_url: null,
      cover_image_prompt:
        'Top-down shot of a Brazilian chicken salpicao, creamy and colorful with shredded chicken, bell peppers, carrots, corn, peas, black olives, and golden potato sticks, rustic wooden surface, editorial food photography, natural light',
      difficulty_level: 'easy',
      cost_level: 'medium',
      prep_time_minutes: 50,
      servings: 12,
      usage_context: 'Almoço de domingo, confraternizações e festas',
      notes: '<p><strong>Dica do chefe:</strong> A batata palha deve ser adicionada apenas no momento de servir para manter a crocância.</p>',
      status: 'draft',
      is_featured: false,
      is_premium: false,
      published_at: null,
      tags: [
        { name: 'Festa', slug: 'festa', tag_type: 'context' },
        { name: 'Fácil', slug: 'facil', tag_type: 'difficulty' },
      ],
      ingredients: [
        {
          name: 'Peito de frango desossado',
          quantity_label: '1 kg',
          unit: 'kg',
          normalized_name: 'peito de frango desossado',
          sort_order: 1,
          is_optional: false,
        },
        {
          name: 'Maionese',
          quantity_label: '500 g',
          unit: 'g',
          normalized_name: 'maionese',
          sort_order: 2,
          is_optional: false,
        },
        {
          name: 'Milho verde em conserva',
          quantity_label: '1 lata',
          unit: 'lata',
          normalized_name: 'milho verde em conserva',
          sort_order: 3,
          is_optional: false,
        },
        {
          name: 'Cebola roxa média',
          quantity_label: '1 unidade',
          unit: 'unidade',
          normalized_name: 'cebola roxa media',
          sort_order: 4,
          is_optional: false,
        },
        {
          name: 'Azeite de oliva extra virgem',
          quantity_label: '2 colheres de sopa',
          unit: 'colher de sopa',
          normalized_name: 'azeite de oliva extra virgem',
          sort_order: 5,
          is_optional: true,
        },
        {
          name: 'Sal',
          quantity_label: 'a gosto',
          unit: 'a gosto',
          normalized_name: 'sal',
          sort_order: 6,
          is_optional: false,
        },
      ],
      steps: [
        { step_number: 1, content: 'Cozinhe e desfie o frango.' },
        { step_number: 2, content: 'Misture os ingredientes em uma tigela grande.' },
      ],
    },
    null,
    2
  )
}

export function slugifyRecipe(value: string): string {
  return slugify(value)
}

export function humanizeRecipeSlug(value: string): string {
  return humanizeSlug(value)
}
