import { useEffect, useMemo, useState } from 'react'
import { ExternalLink, ImagePlus, Loader2, RefreshCw, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useRecipeCoverAutomation } from '@/hooks/admin/useRecipeCoverAutomation'
import type { RecipeAutomationCategory } from '@/hooks/admin/useRecipeAutomation'

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

function queueLabel(status?: string | null) {
  if (status === 'pending') return 'Na fila'
  if (status === 'processing') return 'Gerando'
  if (status === 'failed') return 'Falhou'
  if (status === 'succeeded') return 'Concluída'
  if (status === 'skipped') return 'Ignorada'
  return 'Sem solicitação'
}

export function RecipeCoverPendingTab({ categories }: { categories: RecipeAutomationCategory[] }) {
  const [automationOnly, setAutomationOnly] = useState(true)
  const [categorySlug, setCategorySlug] = useState('')
  const [status, setStatus] = useState('all')
  const [selected, setSelected] = useState<string[]>([])

  const filters = useMemo(() => ({
    automation_only: automationOnly,
    category_slug: categorySlug,
    status,
  }), [automationOnly, categorySlug, status])

  const {
    data,
    isLoading,
    isFetching,
    refetch,
    requestOneMutation,
    requestBatchMutation,
  } = useRecipeCoverAutomation(filters)

  const recipes = data?.recipes || []
  const visibleIds = useMemo(() => new Set(recipes.map((recipe) => recipe.id)), [recipes])

  useEffect(() => {
    setSelected((current) => current.filter((id) => visibleIds.has(id)))
  }, [visibleIds])

  const selectedCount = selected.length
  const allSelectable = recipes.filter((recipe) => !['pending', 'processing'].includes(recipe.cover_request?.status || ''))
  const allSelected = allSelectable.length > 0 && allSelectable.every((recipe) => selected.includes(recipe.id))

  const toggleSelected = (id: string) => {
    setSelected((current) => current.includes(id)
      ? current.filter((value) => value !== id)
      : [...current, id].slice(0, BATCH_LIMIT))
  }

  const toggleAll = () => {
    if (allSelected) {
      setSelected([])
      return
    }
    setSelected(allSelectable.slice(0, BATCH_LIMIT).map((recipe) => recipe.id))
  }

  return (
    <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      <div className="border-b px-6 py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ImagePlus className="h-5 w-5 text-[#f76f25]" />
              <h2 className="font-black text-slate-800">Receitas sem imagem de capa</h2>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Gere capas com Gemini 2.5 Flash Image. A fila processa até 5 imagens por ciclo e nunca sobrescreve uma capa existente.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => refetch()} disabled={isFetching} className="rounded-full">
              <RefreshCw className={cn('mr-2 h-4 w-4', isFetching && 'animate-spin')} />
              Atualizar
            </Button>
            <Button
              type="button"
              disabled={selectedCount === 0 || requestBatchMutation.isPending}
              onClick={() => requestBatchMutation.mutate(selected)}
              className="rounded-full bg-[#f76f25] hover:bg-[#e8621f]"
            >
              {requestBatchMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Gerar selecionadas ({selectedCount})
            </Button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
          <label className="flex items-center gap-2 rounded-xl border px-4 py-3 text-xs font-bold text-slate-600">
            <input type="checkbox" checked={automationOnly} onChange={(event) => setAutomationOnly(event.target.checked)} />
            Somente criadas por automação
          </label>
          <select value={categorySlug} onChange={(event) => setCategorySlug(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-600">
            <option value="">Todas as categorias</option>
            {categories.map((category) => <option key={category.slug} value={category.slug}>{category.name}</option>)}
          </select>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-600">
            <option value="all">Todos os status</option>
            <option value="draft">Rascunhos</option>
            <option value="published">Publicadas</option>
            <option value="archived">Arquivadas</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 px-6 py-16 text-sm text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" /> Carregando receitas sem capa...
        </div>
      ) : recipes.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <ImagePlus className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-4 text-sm font-bold text-slate-600">Nenhuma receita sem capa para estes filtros.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead className="bg-slate-50/80 text-[10px] font-black uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-6 py-3"><input type="checkbox" checked={allSelected} onChange={toggleAll} /></th>
                <th className="px-4 py-3">Receita</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Criada em</th>
                <th className="px-4 py-3">Fila</th>
                <th className="px-6 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recipes.map((recipe) => {
                const busy = ['pending', 'processing'].includes(recipe.cover_request?.status || '')
                const checked = selected.includes(recipe.id)
                return (
                  <tr key={recipe.id} className="hover:bg-slate-50/60">
                    <td className="px-6 py-4">
                      <input type="checkbox" checked={checked} disabled={busy || (!checked && selectedCount >= BATCH_LIMIT)} onChange={() => toggleSelected(recipe.id)} />
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm font-bold text-slate-700">{recipe.title}</p>
                      <p className="mt-1 text-[11px] text-slate-400">{recipe.is_automation_created ? 'Criada por automação' : 'Receita existente'}</p>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-500">{recipe.category_name || '—'}</td>
                    <td className="px-4 py-4 text-sm text-slate-500">{formatDate(recipe.created_at)}</td>
                    <td className="px-4 py-4">
                      <span className={cn(
                        'rounded-full px-2.5 py-1 text-[11px] font-bold',
                        recipe.cover_request?.status === 'failed' ? 'bg-red-50 text-red-600'
                          : busy ? 'bg-amber-50 text-amber-700'
                            : 'bg-slate-100 text-slate-500',
                      )}>
                        {queueLabel(recipe.cover_request?.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <Link to={`/admin/receitas/${recipe.id}`} className="inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-bold text-slate-600 no-underline hover:text-[#f76f25]">
                          Editar <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={busy || requestOneMutation.isPending}
                          onClick={() => requestOneMutation.mutate(recipe.id)}
                          className="rounded-full"
                        >
                          <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                          {recipe.cover_request?.status === 'failed' ? 'Tentar novamente' : 'Gerar capa'}
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

      <div className="border-t bg-slate-50/60 px-6 py-3 text-[11px] text-slate-500">
        Até {BATCH_LIMIT} receitas por solicitação em lote. Custo estimado: cerca de US$ 0,039 por imagem gerada.
      </div>
    </section>
  )
}
