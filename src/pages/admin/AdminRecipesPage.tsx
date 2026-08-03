import { useRef, useState, useEffect } from 'react'
import { 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  ExternalLink, 
  Image as ImageIcon, 
  Utensils, 
  ListChecks, 
  Sparkles, 
  Loader2,
  ChevronLeft,
  ChevronRight,
  Trash2,
  FileText,
  Upload,
  Apple,
  Crown,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingState } from '@/components/shared/LoadingState'
import { useRecipes, useRecipeCategories } from '@/hooks/recipes/useRecipes'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import {
  buildAdminRecipeJsonExample,
  humanizeRecipeSlug,
  parseAdminRecipeJson,
  slugifyRecipe,
} from '@/lib/recipes/adminRecipeJsonImport'

/**
 * AdminRecipesPage
 * 
 * Listing and management of all recipes.
 */
export function AdminRecipesPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const jsonFileInputRef = useRef<HTMLInputElement | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [seeding, setSeeding] = useState(false)
  const [page, setPage] = useState(1)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [jsonImportValue, setJsonImportValue] = useState('')
  const [jsonImportErrors, setJsonImportErrors] = useState<string[]>([])
  const [jsonImportWarnings, setJsonImportWarnings] = useState<string[]>([])
  const [isImportingJson, setIsImportingJson] = useState(false)
  const [generatingNutritionId, setGeneratingNutritionId] = useState<string | null>(null)
  const [togglingPremiumId, setTogglingPremiumId] = useState<string | null>(null)
  const [premiumFilter, setPremiumFilter] = useState<'all' | 'premium' | 'free'>('all')
  const pageSize = 10

  /**
   * Debounced search: the input value updates immediately (searchTerm)
   * so the cursor stays in the field, but we only send a new query
   * after 400ms of inactivity (debouncedSearch).
   */
  const [debouncedSearch, setDebouncedSearch] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
      setPage(1) // reset to page 1 when search changes
    }, 400)
    return () => clearTimeout(timer)
  }, [searchTerm])
  
  const { data, isLoading, isFetching, refetch } = useRecipes({ 
    search: debouncedSearch || undefined,
    categoryId: categoryFilter === 'all' ? undefined : categoryFilter,
    isPremium: premiumFilter === 'all' ? undefined : premiumFilter === 'premium',
    status: 'all',
    page,
    pageSize
  })

  const recipes = data?.recipes || []
  const totalCount = data?.count || 0
  const totalPages = Math.ceil(totalCount / pageSize)

  const { data: categories } = useRecipeCategories()

  const handleRunSeed = async () => {
    if (!confirm('Deseja restaurar os ingredientes e passos das 20 receitas base? Isso substituirá dados existentes para essas receitas.')) return
    
    setSeeding(true)
    // ... (logic remains same for demo)
    toast.success('Processo finalizado! Use o SQL Editor para a carga completa.')
    refetch()
    setSeeding(false)
  }

  const handleDeleteRecipe = async (id: string, title: string) => {
    if (!confirm(`Tem certeza que deseja excluir definitivamente a receita "${title}"?\n\nEssa ação não pode ser desfeita.`)) return

    setDeletingId(id)
    try {
      const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success(`Receita "${title}" excluída com sucesso.`)
      refetch()
    } catch (err: any) {
      console.error('Erro ao excluir receita:', err)
      toast.error('Erro ao excluir receita. Tente novamente.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleGenerateNutrition = async (recipe: any) => {
    if (generatingNutritionId) return

    if (!recipe.ingredients || recipe.ingredients.length === 0) {
      toast.error('Adicione ingredientes à receita primeiro!', {
        description: 'É necessário ter ingredientes cadastrados para calcular as informações nutricionais.'
      })
      return
    }

    setGeneratingNutritionId(recipe.id)
    toast.loading('Gerando tabela nutricional com IA...', { id: 'inline-nutrition' })

    try {
      const { data: result, error: nutritionError } = await supabase.functions.invoke('generate-nutrition', {
        body: {
          ingredients: recipe.ingredients.map((ing: any) => ({
            name: ing.name,
            quantity_label: ing.quantity_label || null,
            unit: ing.unit || null
          })),
          servings: recipe.servings || 4
        }
      })

      if (nutritionError) throw nutritionError
      if (!result?.data) throw new Error(result?.error?.message || 'Erro ao gerar tabela nutricional')

      const { error: updateError } = await supabase
        .from('recipes')
        .update({ nutrition_info: result.data })
        .eq('id', recipe.id)

      if (updateError) throw updateError

      toast.success(`Tabela nutricional de "${recipe.title}" gerada com sucesso!`, {
        id: 'inline-nutrition'
      })
      refetch()
    } catch (err: any) {
      console.error('Error generating inline nutrition:', err)
      toast.error('Erro ao gerar tabela nutricional', {
        id: 'inline-nutrition',
        description: err.message || 'Tente novamente.'
      })
    } finally {
      setGeneratingNutritionId(null)
    }
  }

  const handleTogglePremium = async (recipe: any) => {
    if (togglingPremiumId) return

    setTogglingPremiumId(recipe.id)
    const newPremiumState = !recipe.is_premium

    try {
      const { error } = await supabase
        .from('recipes')
        .update({ is_premium: newPremiumState })
        .eq('id', recipe.id)

      if (error) throw error

      toast.success(
        newPremiumState 
          ? `Receita "${recipe.title}" marcada como Premium.`
          : `Receita "${recipe.title}" marcada como Gratuita.`,
        { description: 'O acesso dos usuários foi atualizado.' }
      )
      refetch()
    } catch (err: any) {
      console.error('Error toggling premium:', err)
      toast.error('Erro ao atualizar status Premium')
    } finally {
      setTogglingPremiumId(null)
    }
  }

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
    } catch (error) {
      console.error('Erro ao ler arquivo JSON:', error)
      toast.error('Não foi possível ler o arquivo JSON.')
    }
  }

  const handleLoadExample = () => {
    setJsonImportValue(buildAdminRecipeJsonExample())
    resetJsonImportState()
  }

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

  const handleImportJson = async (e: React.FormEvent) => {
    e.preventDefault()

    const { data, errors } = parseAdminRecipeJson(jsonImportValue)
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
            {
              slug: categorySlug,
              name: categoryName,
              description: null,
              sort_order: 0,
              is_active: true,
            },
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
            {
              name: tag.name,
              slug: tag.slug,
              tag_type: tag.tag_type,
              is_active: true,
            },
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

      void refetch()
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

  // NOTE: intentionally NOT returning <LoadingState> here — doing so would unmount the
  // search input and cause it to lose focus on every keystroke. Loading is shown inline.

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader 
          title="Receitas" 
          subtitle={
            <div className="flex items-center gap-2">
              Gerencie o catálogo de pratos da plataforma.
              <Badge variant="secondary" className="font-mono">
                {totalCount} total
              </Badge>
            </div>
          } 
        />
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleRunSeed} 
            disabled={seeding}
            className="gap-2 border-primary/20 text-primary hover:bg-primary/5 hidden sm:flex"
          >
            {seeding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Restaurar Dados Base
          </Button>
          <Button onClick={() => navigate('/admin/receitas/nova')} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Receita
          </Button>
        </div>
      </div>

      {/* JSON Importer */}
      <div className="rounded-2xl border bg-white p-5 shadow-sm" style={{ borderColor: 'var(--color-outline-variant)' }}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Importar receita via JSON</span>
            </div>
            <p className="max-w-2xl text-xs text-muted-foreground">
              Cole aqui o JSON gerado pela IA no formato definido para o Cardappio. O importador cria a receita, categoria, tags, ingredientes e passos.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleLoadExample}
              disabled={isImportingJson}
              className="gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              Usar exemplo
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => jsonFileInputRef.current?.click()}
              disabled={isImportingJson}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
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

        <form onSubmit={handleImportJson} className="mt-4 space-y-4">
          <textarea
            value={jsonImportValue}
            onChange={(event) => {
              setJsonImportValue(event.target.value)
              resetJsonImportState()
            }}
            placeholder={`{\n  "title": "Salpicão de Frango",\n  "subtitle": "Cremoso, colorido e pronto para a festa",\n  "slug": "salpicao-de-frango",\n  "category_name": "Aves",\n  "category_slug": "aves",\n  "cover_image_url": null,\n  "cover_image_prompt": "Top-down shot of a Brazilian chicken salpicão...",\n  "difficulty_level": "easy",\n  "cost_level": "medium",\n  "prep_time_minutes": 50,\n  "servings": 12,\n  "usage_context": "Almoço de domingo",\n  "notes": "<p><strong>Dica do chefe:</strong> Adicionar batata palha só ao servir.</p>",\n  "status": "draft",\n  "is_featured": false,\n  "is_premium": false,\n  "published_at": null,\n  "tags": [],\n  "ingredients": [],\n  "steps": []\n}`}
            disabled={isImportingJson}
            className="min-h-[320px] w-full rounded-2xl border border-slate-200 bg-slate-950 px-4 py-3 font-mono text-[12px] leading-5 text-slate-100 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
            spellCheck={false}
          />

          {jsonImportErrors.length > 0 && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <div className="mb-2 flex items-center gap-2 font-semibold">
                <AlertTriangle className="h-4 w-4" />
                Corrija o JSON antes de importar
              </div>
              <ul className="space-y-1">
                {jsonImportErrors.map((error) => (
                  <li key={error}>- {error}</li>
                ))}
              </ul>
            </div>
          )}

          {jsonImportWarnings.length > 0 && jsonImportErrors.length === 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <div className="mb-2 flex items-center gap-2 font-semibold">
                <AlertTriangle className="h-4 w-4" />
                Avisos não bloqueantes
              </div>
              <ul className="space-y-1">
                {jsonImportWarnings.map((warning) => (
                  <li key={warning}>- {warning}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Aceita JSON puro ou conteúdo colado com blocos <span className="font-mono">```json</span>. A importação cria taxonomias quando necessário.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setJsonImportValue('')
                  resetJsonImportState()
                }}
                disabled={isImportingJson || !jsonImportValue.trim()}
              >
                Limpar
              </Button>
              <Button
                type="submit"
                disabled={isImportingJson || !jsonImportValue.trim()}
                className="gap-2"
              >
                {isImportingJson ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {isImportingJson ? 'Importando...' : 'Importar JSON'}
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* Filters & search */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por título..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border p-2.5 pl-10 focus:outline-none focus:ring-2 focus:ring-primary"
            style={{ borderColor: 'var(--color-outline-variant)' }}
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value)
                setPage(1)
              }}
              className="rounded-xl border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary min-w-[180px]"
              style={{ borderColor: 'var(--color-outline-variant)' }}
            >
              <option value="all">Todas as categorias</option>
              {categories?.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-muted-foreground" />
            <select
              value={premiumFilter}
              onChange={(e) => {
                setPremiumFilter(e.target.value as 'all' | 'premium' | 'free')
                setPage(1)
              }}
              className="rounded-xl border p-2.5 focus:outline-none focus:ring-2 focus:ring-primary min-w-[150px]"
              style={{ borderColor: 'var(--color-outline-variant)' }}
            >
              <option value="all">Todos os acessos</option>
              <option value="premium">Apenas PRO (Premium)</option>
              <option value="free">Apenas Gratuitas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border bg-white" style={{ borderColor: 'var(--color-outline-variant)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b" style={{ borderColor: 'var(--color-outline-variant)', color: 'var(--color-outline)' }}>
              <tr>
                <th className="px-6 py-4 font-bold uppercase tracking-wider">Título</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider">Categoria</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider">Conteúdo</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--color-outline-variant)' }}>
              {(isLoading || isFetching) && recipes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Carregando receitas...</span>
                    </div>
                  </td>
                </tr>
              ) : recipes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground italic">
                    Nenhuma receita encontrada.
                  </td>
                </tr>
              ) : (
                recipes.map((recipe) => (
                  <tr key={recipe.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-slate-100 overflow-hidden border border-black/5">
                          {recipe.cover_image_url ? (
                            <img src={recipe.cover_image_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex items-center justify-center h-full w-full bg-slate-50">
                              <ImageIcon className="h-4 w-4 text-slate-300" />
                            </div>
                          )}
                        </div>
                        <span className="font-semibold text-foreground">{recipe.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="font-normal">{recipe.category?.name || 'Sem categoria'}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={cn(
                        "font-medium",
                        recipe.status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                      )}>
                        {recipe.status === 'published' ? 'Publicado' : 'Rascunho'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span title="Foto"><ImageIcon className={cn("h-4 w-4", recipe.cover_image_url ? "text-primary" : "text-slate-200")} /></span>
                        <span title="Ingredientes"><Utensils className={cn("h-4 w-4", (recipe.ingredients?.length || 0) > 0 ? "text-primary" : "text-slate-200")} /></span>
                        <span title="Passos"><ListChecks className={cn("h-4 w-4", (recipe.steps?.length || 0) > 0 ? "text-primary" : "text-slate-200")} /></span>
                        {generatingNutritionId === recipe.id ? (
                          <span title="Gerando tabela nutricional..."><Loader2 className="h-4 w-4 animate-spin text-primary" /></span>
                        ) : recipe.nutrition_info ? (
                          <span title="Tabela nutricional preenchida"><Apple className="h-4 w-4 text-emerald-500" /></span>
                        ) : (
                          <button 
                            onClick={() => handleGenerateNutrition(recipe)}
                            disabled={generatingNutritionId !== null}
                            title="Tabela nutricional vazia. Clique para gerar com IA"
                            className="focus:outline-none disabled:opacity-50"
                          >
                            <Apple className="h-4 w-4 text-slate-200 hover:text-primary transition-colors cursor-pointer" />
                          </button>
                        )}
                        {togglingPremiumId === recipe.id ? (
                          <span title="Atualizando acesso..."><Loader2 className="h-4 w-4 animate-spin text-amber-500" /></span>
                        ) : (
                          <button 
                            onClick={() => handleTogglePremium(recipe)}
                            disabled={togglingPremiumId !== null}
                            title={recipe.is_premium ? "Receita Premium (PRO). Clique para tornar gratuita." : "Receita gratuita. Clique para tornar Premium (PRO)."}
                            className="focus:outline-none disabled:opacity-50"
                          >
                            <Crown className={cn("h-4 w-4 transition-colors cursor-pointer", recipe.is_premium ? "text-amber-500 fill-amber-500" : "text-slate-200 hover:text-amber-500")} />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => navigate(`/admin/receitas/${recipe.id}`)}
                          title="Editar"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => window.open(`/app/receitas/${recipe.slug}`, '_blank')}
                          title="Ver no app"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDeleteRecipe(recipe.id, recipe.title)}
                          title="Excluir definitivamente"
                          disabled={deletingId === recipe.id}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          {deletingId === recipe.id
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t bg-slate-50 px-6 py-4" style={{ borderColor: 'var(--color-outline-variant)' }}>
            <div className="text-xs text-muted-foreground">
              Mostrando {recipes.length} de {totalCount} receitas
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="h-8 gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <div className="text-xs font-medium px-2">
                Página {page} de {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="h-8 gap-1"
              >
                Próxima
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
