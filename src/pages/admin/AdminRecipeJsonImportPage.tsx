import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText,
  Upload,
  CheckCircle2,
  Sparkles,
  Loader2,
  AlertTriangle,
  Code2,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import {
  buildAdminRecipeJsonExample,
  humanizeRecipeSlug,
  parseAdminRecipeJson,
  slugifyRecipe,
} from '@/lib/recipes/adminRecipeJsonImport'
import { useMeasurementUnits } from '@/hooks/recipes/useMeasurementUnits'

const ensureUniqueRecipeSlug = async (baseSlug: string) => {
  const normalizedBase = slugifyRecipe(baseSlug)
  let candidate = normalizedBase
  let suffix = 2

  while (true) {
    const { data, error } = await supabase
      .from('recipes')
      .select('id')
      .eq('slug', candidate)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') throw error
    if (!data) return candidate

    candidate = `${normalizedBase}-${suffix}`
    suffix += 1
  }
}

export function AdminRecipeJsonImportPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const jsonFileInputRef = useRef<HTMLInputElement | null>(null)
  const { units } = useMeasurementUnits()

  const [jsonImportValue, setJsonImportValue] = useState('')
  const [jsonImportErrors, setJsonImportErrors] = useState<string[]>([])
  const [jsonImportWarnings, setJsonImportWarnings] = useState<string[]>([])
  const [isImportingJson, setIsImportingJson] = useState(false)

  const resetJsonImportState = () => {
    setJsonImportErrors([])
    setJsonImportWarnings([])
  }

  const handleLoadJsonFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const text = await file.text()
      setJsonImportValue(text)
      resetJsonImportState()
    } catch {
      toast.error('Não foi possível ler o arquivo JSON.')
    }
  }

  const handleLoadExample = () => {
    setJsonImportValue(buildAdminRecipeJsonExample())
    resetJsonImportState()
  }

  const handleImportJson = async (e: React.FormEvent) => {
    e.preventDefault()

    const activeUnitSymbols = units.map((u) => u.value)
    const { data, errors } = parseAdminRecipeJson(jsonImportValue, activeUnitSymbols)
    setJsonImportErrors(errors)

    if (!data) {
      setJsonImportWarnings([])
      toast.error('Corrija o JSON antes de importar.')
      return
    }

    setJsonImportWarnings(data.warnings)
    setIsImportingJson(true)

    let createdRecipeId: string | null = null
    const toastId = 'recipe-json-import'

    try {
      const { data: authData } = await supabase.auth.getUser()
      const currentUserId = authData.user?.id ?? null

      toast.loading('Importando receita em JSON...', { id: toastId })

      let categoryId: string | null = null
      if (data.category_name || data.category_slug) {
        const categorySlug = data.category_slug || slugifyRecipe(data.category_name || '')
        const categoryName = data.category_name || humanizeRecipeSlug(categorySlug)

        const { data: categoryRow, error: categoryError } = await supabase
          .from('recipe_categories')
          .upsert(
            { slug: categorySlug, name: categoryName, description: null, sort_order: 0, is_active: true },
            { onConflict: 'slug' }
          )
          .select('id')
          .single()

        if (categoryError) throw categoryError
        categoryId = categoryRow.id
      }

      const uniqueSlug = await ensureUniqueRecipeSlug(data.slug || data.title)
      const publishedAt = data.published_at || (data.status === 'published' ? new Date().toISOString() : null)

      const { data: recipeRow, error: recipeError } = await supabase
        .from('recipes')
        .insert({
          title: data.title,
          subtitle: data.subtitle,
          slug: uniqueSlug,
          cover_image_url: data.cover_image_url,
          difficulty_level: data.difficulty_level,
          cost_level: data.cost_level,
          prep_time_minutes: data.prep_time_minutes,
          servings: data.servings,
          category_id: categoryId,
          usage_context: data.usage_context,
          notes: data.notes,
          status: data.status,
          is_featured: data.is_featured,
          is_premium: data.is_premium,
          published_at: publishedAt,
          created_by: currentUserId,
          updated_by: currentUserId,
        })
        .select('id, title, slug')
        .single()

      if (recipeError) throw recipeError
      createdRecipeId = recipeRow.id

      if (data.ingredients.length > 0) {
        const { error: ingredientsError } = await supabase
          .from('recipe_ingredients')
          .insert(
            data.ingredients.map((ingredient) => ({
              recipe_id: recipeRow.id,
              name: ingredient.name,
              quantity_label: ingredient.quantity_label,
              unit: ingredient.unit,
              normalized_name: ingredient.normalized_name || ingredient.name.toLowerCase().trim(),
              sort_order: ingredient.sort_order,
              is_optional: ingredient.is_optional,
            }))
          )
        if (ingredientsError) throw ingredientsError
      }

      if (data.steps.length > 0) {
        const { error: stepsError } = await supabase
          .from('recipe_steps')
          .insert(
            data.steps.map((step) => ({
              recipe_id: recipeRow.id,
              step_number: step.step_number,
              content: step.content,
            }))
          )
        if (stepsError) throw stepsError
      }

      const tagIds: string[] = []
      for (const tag of data.tags) {
        const { data: tagRow, error: tagError } = await supabase
          .from('recipe_tags')
          .upsert(
            { name: tag.name, slug: tag.slug, tag_type: tag.tag_type, is_active: true },
            { onConflict: 'slug' }
          )
          .select('id')
          .single()

        if (tagError) throw tagError
        tagIds.push(tagRow.id)
      }

      if (tagIds.length > 0) {
        const { error: linksError } = await supabase
          .from('recipe_tag_links')
          .insert(tagIds.map((tagId) => ({ recipe_id: recipeRow.id, tag_id: tagId })))
        if (linksError) throw linksError
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['recipes'] }),
        queryClient.invalidateQueries({ queryKey: ['recipe-categories'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-tags'] }),
      ])

      setJsonImportValue('')
      resetJsonImportState()

      toast.success(`Receita "${recipeRow.title}" importada com sucesso!`, {
        id: toastId,
        description: data.warnings.length > 0 ? 'Importada com avisos não bloqueantes.' : 'JSON processado e salvo no banco.',
      })

      navigate(`/admin/receitas/${recipeRow.id}`)
    } catch (err: any) {
      console.error('Erro ao importar receita via JSON:', err)
      if (createdRecipeId) {
        await supabase.from('recipes').delete().eq('id', createdRecipeId)
      }
      toast.error('Erro ao importar receita via JSON', {
        id: toastId,
        description: err?.message || 'Verifique o JSON e tente novamente.',
      })
    } finally {
      setIsImportingJson(false)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title="Importar Receita via JSON"
        subtitle="Cole o JSON gerado pela IA no formato definido para o Cardappio. O importador cria a receita, categoria, tags, ingredientes e passos automaticamente."
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Code2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-slate-800">Editor JSON</p>
              <p className="text-xs text-slate-500 font-medium">
                Aceita JSON puro ou conteúdo com blocos{' '}
                <span className="font-mono bg-slate-100 rounded px-1">```json</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleLoadExample}
              disabled={isImportingJson}
              className="gap-2 rounded-xl"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Usar exemplo
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => jsonFileInputRef.current?.click()}
              disabled={isImportingJson}
              className="gap-2 rounded-xl"
            >
              <Upload className="h-3.5 w-3.5" />
              Carregar arquivo
            </Button>
          </div>
        </div>

        <input
          ref={jsonFileInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={handleLoadJsonFile}
        />

        <form onSubmit={handleImportJson} className="space-y-4">
          <textarea
            value={jsonImportValue}
            onChange={(event) => {
              setJsonImportValue(event.target.value)
              resetJsonImportState()
            }}
            placeholder={`{\n  "title": "Salpicão de Frango",\n  "subtitle": "Cremoso, colorido e pronto para a festa",\n  "slug": "salpicao-de-frango",\n  "category_name": "Aves",\n  "category_slug": "aves",\n  "cover_image_url": null,\n  "difficulty_level": "easy",\n  "cost_level": "medium",\n  "prep_time_minutes": 50,\n  "servings": 12,\n  "status": "draft",\n  "is_featured": false,\n  "is_premium": false,\n  "tags": [],\n  "ingredients": [],\n  "steps": []\n}`}
            disabled={isImportingJson}
            rows={20}
            className="min-h-[400px] w-full rounded-2xl border border-slate-200 bg-slate-950 px-4 py-3 font-mono text-[12px] leading-5 text-slate-100 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
            spellCheck={false}
          />

          {/* Error messages */}
          {jsonImportErrors.length > 0 && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <div className="mb-2 flex items-center gap-2 font-bold">
                <AlertTriangle className="h-4 w-4" />
                Corrija o JSON antes de importar
              </div>
              <ul className="space-y-1 text-xs">
                {jsonImportErrors.map((error) => (
                  <li key={error}>— {error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Warning messages */}
          {jsonImportWarnings.length > 0 && jsonImportErrors.length === 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <div className="mb-2 flex items-center gap-2 font-bold">
                <AlertTriangle className="h-4 w-4" />
                Avisos não bloqueantes
              </div>
              <ul className="space-y-1 text-xs">
                {jsonImportWarnings.map((warning) => (
                  <li key={warning}>— {warning}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2">
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              A importação cria categorias, tags, ingredientes e passos automaticamente.
              Receitas importadas ficam como <strong>Rascunho</strong> por padrão.
            </p>
            <div className="flex flex-wrap gap-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setJsonImportValue('')
                  resetJsonImportState()
                }}
                disabled={isImportingJson || !jsonImportValue.trim()}
                className="rounded-xl"
              >
                Limpar
              </Button>
              <Button
                type="submit"
                disabled={isImportingJson || !jsonImportValue.trim()}
                className="gap-2 rounded-xl"
              >
                {isImportingJson ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {isImportingJson ? 'Importando...' : 'Importar JSON'}
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* Info box */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-2">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-slate-400" />
          <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Sobre o formato</p>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          O JSON deve seguir o schema definido no Cardappio. Os campos obrigatórios são{' '}
          <code className="font-mono bg-slate-100 px-1 rounded">title</code>,{' '}
          <code className="font-mono bg-slate-100 px-1 rounded">ingredients</code> e{' '}
          <code className="font-mono bg-slate-100 px-1 rounded">steps</code>.
          Clique em <strong>"Usar exemplo"</strong> para ver a estrutura completa esperada.
        </p>
      </div>
    </div>
  )
}
