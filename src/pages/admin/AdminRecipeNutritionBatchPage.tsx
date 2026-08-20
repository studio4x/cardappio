import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Scale,
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Sparkles,
  RefreshCw,
  Calculator,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingState } from '@/components/shared/LoadingState'
import { useRecipeNutritionBatch } from '@/hooks/admin/useRecipeNutritionBatch'
import { useRecipeCategories } from '@/hooks/recipes/useRecipes'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const BATCH_LIMIT = 20

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
      timeZone: 'America/Sao_Paulo',
    }).format(new Date(value))
  } catch {
    return '—'
  }
}

export function AdminRecipeNutritionBatchPage() {
  const [categoryId, setCategoryId] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [onlyPending, setOnlyPending] = useState(true)
  const [page, setPage] = useState(1)
  const [selectedRecipes, setSelectedRecipes] = useState<string[]>([])
  
  // Batch processing state
  const [batchProcessing, setBatchProcessing] = useState(false)
  const [processedCount, setProcessedCount] = useState(0)
  const [successCount, setSuccessCount] = useState(0)
  const [errorCount, setErrorCount] = useState(0)
  const [currentRecipeName, setCurrentRecipeName] = useState('')

  const filters = useMemo(() => ({
    categoryId: categoryId === 'all' ? undefined : categoryId,
    search: search.trim() || undefined,
    onlyPending,
    page,
    pageSize: 15
  }), [categoryId, search, onlyPending, page])

  const { data: categoriesData } = useRecipeCategories()
  const { data, isLoading, isFetching, refetch, generateNutritionMutation } = useRecipeNutritionBatch(filters)

  const recipes = data?.recipes || []
  const totalCount = data?.total || 0
  const totalPages = Math.ceil(totalCount / 15)

  // Reset selected recipes when filters or recipes change
  useEffect(() => {
    setSelectedRecipes([])
  }, [categoryId, search, onlyPending, page])

  const allSelectable = recipes.filter(r => r.ingredients.length > 0)
  const allSelected = allSelectable.length > 0 && allSelectable.every(r => selectedRecipes.includes(r.id))

  const toggleSelect = (id: string) => {
    setSelectedRecipes(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id)
      } else {
        if (prev.length >= BATCH_LIMIT) {
          toast.warning(`Limite de lote atingido (${BATCH_LIMIT} receitas por vez).`)
          return prev
        }
        return [...prev, id]
      }
    })
  }

  const toggleAll = () => {
    if (allSelected) {
      setSelectedRecipes([])
    } else {
      setSelectedRecipes(allSelectable.slice(0, BATCH_LIMIT).map(r => r.id))
    }
  }

  const handleBatchGenerate = async () => {
    if (selectedRecipes.length === 0) return
    
    setBatchProcessing(true)
    setProcessedCount(0)
    setSuccessCount(0)
    setErrorCount(0)

    const queue = [...selectedRecipes]

    for (let i = 0; i < queue.length; i++) {
      const recipeId = queue[i]
      const recipe = recipes.find(r => r.id === recipeId)
      setCurrentRecipeName(recipe?.title || 'Receita...')

      try {
        await generateNutritionMutation.mutateAsync(recipeId)
        setSuccessCount(prev => prev + 1)
      } catch (err: any) {
        console.error('Batch generate error:', err)
        setErrorCount(prev => prev + 1)
        toast.error(`Falha ao gerar para "${recipe?.title}": ${err.message || 'Erro desconhecido'}`)
      } finally {
        setProcessedCount(prev => prev + 1)
      }
    }

    setBatchProcessing(false)
    setSelectedRecipes([])
    setCurrentRecipeName('')
    refetch()
    toast.success('Processamento em lote finalizado!')
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title="Nutrição em Lote"
        subtitle="Gere tabelas nutricionais oficiais baseadas na TACO para múltiplas receitas de uma só vez."
      />

      {/* Batch generation progress indicator */}
      {batchProcessing && (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-6 space-y-4 shadow-sm animate-in zoom-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Loader2 className="h-5 w-5 text-emerald-600 animate-spin" />
              <p className="text-sm font-bold text-emerald-950">
                Processando lote: {processedCount} de {selectedRecipes.length} concluídas
              </p>
            </div>
            <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
              {Math.round((processedCount / selectedRecipes.length) * 100)}%
            </span>
          </div>

          <div className="w-full bg-emerald-100/50 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-600 h-full transition-all duration-300"
              style={{ width: `${(processedCount / selectedRecipes.length) * 100}%` }}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-semibold text-emerald-900/80">
            <p>Processando: <strong className="text-emerald-950">{currentRecipeName}</strong></p>
            <div className="flex gap-4">
              <span>✅ Sucessos: <strong className="text-emerald-950 font-bold">{successCount}</strong></span>
              {errorCount > 0 && <span>❌ Falhas: <strong className="text-red-600 font-bold">{errorCount}</strong></span>}
            </div>
          </div>
        </div>
      )}

      {/* Filters and Controls */}
      <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="border-b px-6 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-emerald-600" />
                <h2 className="font-black text-slate-800">Fila de Geração Nutricional</h2>
              </div>
              <p className="mt-1 text-xs text-slate-500 font-medium">
                Selecione as receitas e gere as tabelas usando dados reais da base laboratorial da TACO.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => refetch()}
                disabled={isFetching || batchProcessing}
                className="rounded-full"
              >
                <RefreshCw className={cn('mr-2 h-4 w-4', isFetching && 'animate-spin')} />
                Atualizar
              </Button>
              <Button
                type="button"
                disabled={selectedRecipes.length === 0 || batchProcessing}
                onClick={handleBatchGenerate}
                className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Gerar Selecionadas ({selectedRecipes.length})
              </Button>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                placeholder="Buscar receita..."
                className="w-full h-10 rounded-xl border border-slate-200 pl-9 pr-4 text-xs font-semibold text-slate-900 outline-none focus:border-emerald-500"
              />
            </div>

            {/* Category Filter */}
            <select
              value={categoryId}
              onChange={(e) => { setCategoryId(e.target.value); setPage(1) }}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 outline-none focus:border-emerald-500"
            >
              <option value="all">Todas as categorias</option>
              {categoriesData?.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>

            {/* Toggle Status Checkbox */}
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/50 px-4 h-10 text-xs font-bold text-slate-600 cursor-pointer hover:bg-slate-50 transition-all select-none">
              <input
                type="checkbox"
                checked={onlyPending}
                onChange={(e) => { setOnlyPending(e.target.checked); setPage(1) }}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              Somente receitas sem tabela nutricional
            </label>
          </div>
        </div>

        {/* Table Content */}
        {isLoading ? (
          <LoadingState message="Carregando fila nutricional..." />
        ) : recipes.length === 0 ? (
          <div className="px-6 py-16 text-center space-y-2">
            <Calculator className="mx-auto h-10 w-10 text-slate-300" />
            <p className="text-sm font-bold text-slate-600">Nenhuma receita pendente encontrada.</p>
            <p className="text-xs text-slate-500">Experimente alterar os filtros de busca ou desmarcar a opção de exibição exclusiva de pendentes.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-6 py-3.5 w-12">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      disabled={batchProcessing || allSelectable.length === 0}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                  </th>
                  <th className="px-4 py-3.5">Receita</th>
                  <th className="px-4 py-3.5">Categoria</th>
                  <th className="px-4 py-3.5">Ingredientes</th>
                  <th className="px-4 py-3.5">Tabela Nutricional</th>
                  <th className="px-6 py-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recipes.map((recipe) => {
                  const hasIngredients = recipe.ingredients.length > 0
                  const hasNutrition = recipe.nutrition_info !== null
                  const checked = selectedRecipes.includes(recipe.id)
                  const isBusy = generateNutritionMutation.isPending && generateNutritionMutation.variables === recipe.id

                  return (
                    <tr key={recipe.id} className={cn('hover:bg-slate-50/60 transition-colors', isBusy && 'bg-emerald-50/30')}>
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={!hasIngredients || batchProcessing || isBusy}
                          onChange={() => toggleSelect(recipe.id)}
                          className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm font-bold text-slate-700">{recipe.title}</p>
                        <span className={cn(
                          'inline-block mt-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide',
                          recipe.status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        )}>
                          {recipe.status === 'published' ? 'Publicada' : 'Rascunho'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-xs font-bold text-slate-600">
                        {recipe.category?.name || '—'}
                      </td>
                      <td className="px-4 py-4">
                        {hasIngredients ? (
                          <span className="text-xs font-bold text-slate-700">
                            {recipe.ingredients.length} item{recipe.ingredients.length === 1 ? '' : 's'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                            <AlertTriangle className="h-3 w-3" />
                            Sem ingredientes
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {hasNutrition ? (
                          <div className="text-[11px] font-bold text-slate-600 space-y-0.5">
                            <p className="text-emerald-700 font-extrabold flex items-center gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Tabela Ativa ({recipe.nutrition_info.serving_size_g_ml}g)
                            </p>
                            <p className="text-slate-400">
                              {recipe.nutrition_info.nutrients.energy_kcal.per_serving} kcal · Carbs: {recipe.nutrition_info.nutrients.carbs.per_serving}g · Prot: {recipe.nutrition_info.nutrients.protein.per_serving}g
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-slate-400">
                            Pendente
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <Link
                            to={`/admin/receitas/nova?id=${recipe.id}`}
                            className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 h-8 text-xs font-bold text-slate-600 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-xs"
                          >
                            Editar <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={!hasIngredients || batchProcessing || isBusy}
                            onClick={() => {
                              toast.promise(generateNutritionMutation.mutateAsync(recipe.id), {
                                loading: 'Consultando TACO e calculando...',
                                success: () => 'Tabela nutricional gerada com sucesso!',
                                error: (err) => err.message || 'Erro ao gerar tabela nutricional.'
                              })
                            }}
                            className="rounded-full h-8 text-xs font-bold border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          >
                            {isBusy ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                            ) : (
                              <Calculator className="h-3.5 w-3.5 mr-1.5" />
                            )}
                            Gerar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-6 py-4 bg-slate-50/50">
            <p className="text-xs font-bold text-slate-500">
              Mostrando {recipes.length} de {totalCount} receitas
            </p>
            
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={page === 1 || batchProcessing}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="h-8 w-8 rounded-full"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs font-black text-slate-700 px-3">
                Página {page} de {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={page === totalPages || batchProcessing}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="h-8 w-8 rounded-full"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <div className="border-t bg-slate-50/60 px-6 py-3 text-[11px] text-slate-500 font-medium">
          Limite de lote: até {BATCH_LIMIT} receitas por ciclo de processamento para estabilidade operacional.
        </div>
      </section>
    </div>
  )
}
