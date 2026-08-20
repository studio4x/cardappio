import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  ExternalLink,
  FileSearch,
  History,
  Info,
  RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type {
  RecipeAutomationGeneratedRecipe,
  RecipeAutomationRunLog,
} from '@/hooks/admin/useRecipeAutomation'

interface RecipeAutomationHistoryTabProps {
  runs: RecipeAutomationRunLog[]
  generatedRecipes: RecipeAutomationGeneratedRecipe[]
  isFetching: boolean
  onRefresh: () => void
}

type JsonRecord = Record<string, unknown>

type HistoryItem = {
  key: string
  status: string
  title: string
  theme: string | null
  occurredAt: string
  recipeId: string | null
  sourceUrl: string | null
  canonicalUrl: string | null
  correlationId: string | null
  errorCode: string | null
  errorMessage: string | null
  geminiUsage: JsonRecord | null
  coverGeneration: JsonRecord | null
  runId: string | null
  runStatus: string | null
  triggerType: string | null
  runSummary: JsonRecord | null
  legacy: boolean
}

function asRecord(value: unknown): JsonRecord | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as JsonRecord
    : null
}

function asText(value: unknown): string | null {
  const text = typeof value === 'string' ? value.trim() : ''
  return text || null
}

function asNumber(value: unknown): number | null {
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function formatDateTime(value?: string | null) {
  if (!value) return '—'
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

function formatUsd(value: unknown) {
  const amount = asNumber(value)
  if (amount === null) return '—'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 4,
    maximumFractionDigits: 6,
  }).format(amount)
}

function statusLabel(status: string) {
  switch (status) {
    case 'created': return 'Sucesso'
    case 'failed': return 'Erro'
    case 'duplicate': return 'Duplicada'
    case 'skipped': return 'Ignorada'
    case 'no_candidates': return 'Sem candidato'
    default: return status || 'Desconhecido'
  }
}

function triggerLabel(trigger: string | null) {
  if (trigger === 'manual') return 'Manual'
  if (trigger === 'scheduled') return 'Programada'
  return trigger || '—'
}

function statusClasses(status: string) {
  if (status === 'created') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (status === 'failed') return 'bg-red-50 text-red-700 border-red-200'
  if (status === 'duplicate') return 'bg-amber-50 text-amber-700 border-amber-200'
  return 'bg-slate-100 text-slate-600 border-slate-200'
}

function buildHistory(
  runs: RecipeAutomationRunLog[],
  generatedRecipes: RecipeAutomationGeneratedRecipe[],
) {
  const items: HistoryItem[] = []
  const detailedRecipeIds = new Set<string>()

  runs.forEach((run, runIndex) => {
    const metadata = asRecord(run.metadata_json) || {}
    const summary = asRecord(metadata.summary) || {}
    const runId = asText(metadata.run_id)
    const triggerType = asText(metadata.trigger_type)
    const occurredAt = asText(metadata.completed_at) || asText(summary.completed_at) || run.created_at
    const outcomes = Array.isArray(summary.outcomes) ? summary.outcomes : []

    if (outcomes.length > 0) {
      outcomes.forEach((rawOutcome, outcomeIndex) => {
        const outcome = asRecord(rawOutcome) || {}
        const recipeId = asText(outcome.recipe_id)
        if (recipeId) detailedRecipeIds.add(recipeId)

        const title =
          asText(outcome.title) ||
          asText(outcome.source_title) ||
          (asText(outcome.theme) ? `Tentativa em ${asText(outcome.theme)}` : null) ||
          'Tentativa de receita'

        items.push({
          key: `${runId || run.created_at}-${outcomeIndex}`,
          status: asText(outcome.status) || 'unknown',
          title,
          theme: asText(outcome.theme),
          occurredAt,
          recipeId,
          sourceUrl: asText(outcome.source_url),
          canonicalUrl: asText(outcome.canonical_url),
          correlationId: asText(outcome.correlation_id),
          errorCode: asText(outcome.error_code),
          errorMessage: asText(outcome.error_message),
          geminiUsage: asRecord(outcome.gemini_usage),
          coverGeneration: asRecord(outcome.cover_generation),
          runId,
          runStatus: run.status || null,
          triggerType,
          runSummary: summary,
          legacy: false,
        })
      })
      return
    }

    const totals = asRecord(summary.totals) || {}
    const failed = asNumber(totals.failed) || 0
    if (run.status === 'failed' || run.status === 'partial' || run.status === 'no_candidates' || failed > 0) {
      const noCandidates = run.status === 'no_candidates'
      items.push({
        key: `legacy-run-${run.created_at}-${runIndex}`,
        status: noCandidates ? 'no_candidates' : 'failed',
        title: noCandidates ? 'Nenhum candidato encontrado' : 'Falha na execução',
        theme: null,
        occurredAt,
        recipeId: null,
        sourceUrl: null,
        canonicalUrl: null,
        correlationId: null,
        errorCode: null,
        errorMessage: 'Registro anterior à captura detalhada dos outcomes. O resumo da execução foi preservado, mas o erro por receita não estava armazenado.',
        geminiUsage: asRecord(summary.gemini_usage),
        coverGeneration: asRecord(summary.cover_generation),
        runId,
        runStatus: run.status || null,
        triggerType,
        runSummary: summary,
        legacy: true,
      })
    }
  })

  generatedRecipes.forEach((recipe) => {
    if (detailedRecipeIds.has(recipe.id)) return
    items.push({
      key: `legacy-recipe-${recipe.id}`,
      status: 'created',
      title: recipe.title,
      theme: null,
      occurredAt: recipe.created_at,
      recipeId: recipe.id,
      sourceUrl: null,
      canonicalUrl: null,
      correlationId: null,
      errorCode: null,
      errorMessage: null,
      geminiUsage: null,
      coverGeneration: null,
      runId: null,
      runStatus: null,
      triggerType: null,
      runSummary: null,
      legacy: true,
    })
  })

  return items.sort((left, right) => {
    const leftTime = new Date(left.occurredAt).getTime()
    const rightTime = new Date(right.occurredAt).getTime()
    return rightTime - leftTime
  })
}

function DetailRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="grid gap-1 border-b border-slate-100 py-3 last:border-b-0 sm:grid-cols-[160px_1fr] sm:gap-4">
      <dt className="text-xs font-black uppercase tracking-wider text-slate-400">{label}</dt>
      <dd className={cn('min-w-0 break-words text-sm font-semibold text-slate-700', mono && 'font-mono text-xs')}>{value}</dd>
    </div>
  )
}

export function RecipeAutomationHistoryTab({
  runs,
  generatedRecipes,
  isFetching,
  onRefresh,
}: RecipeAutomationHistoryTabProps) {
  const [selected, setSelected] = useState<HistoryItem | null>(null)
  const items = useMemo(() => buildHistory(runs, generatedRecipes), [runs, generatedRecipes])
  const successCount = items.filter((item) => item.status === 'created').length
  const errorCount = items.filter((item) => item.status === 'failed').length

  const copyDiagnostic = async (item: HistoryItem) => {
    const payload = {
      status: item.status,
      title: item.title,
      theme: item.theme,
      occurred_at: item.occurredAt,
      recipe_id: item.recipeId,
      source_url: item.sourceUrl,
      run_id: item.runId,
      trigger_type: item.triggerType,
      correlation_id: item.correlationId,
      error_code: item.errorCode,
      error_message: item.errorMessage,
      gemini_usage: item.geminiUsage,
      cover_generation: item.coverGeneration,
    }
    await navigator.clipboard.writeText(JSON.stringify(payload, null, 2))
    toast.success('Resumo do log copiado.')
  }

  return (
    <>
      <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-[#f76f25]" />
              <h2 className="font-black text-slate-800">Histórico da automação</h2>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Tentativas concluídas com sucesso e tentativas interrompidas por erro.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">{successCount} sucesso{successCount === 1 ? '' : 's'}</span>
            <span className="rounded-full bg-red-50 px-3 py-2 text-xs font-black text-red-700">{errorCount} erro{errorCount === 1 ? '' : 's'}</span>
            <Button type="button" variant="outline" size="icon" onClick={onRefresh} disabled={isFetching} className="h-9 w-9 rounded-full" title="Atualizar histórico">
              <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
            </Button>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <FileSearch className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-4 text-sm font-bold text-slate-600">Nenhuma execução registrada ainda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left">
              <thead className="bg-slate-50/80">
                <tr className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Receita / tentativa</th>
                  <th className="px-6 py-3">Categoria</th>
                  <th className="px-6 py-3">Data</th>
                  <th className="px-6 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item.key} className="transition-colors hover:bg-slate-50/60">
                    <td className="px-6 py-4">
                      <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-black', statusClasses(item.status))}>
                        {item.status === 'created' ? <CheckCircle2 className="h-3.5 w-3.5" /> : item.status === 'failed' ? <AlertCircle className="h-3.5 w-3.5" /> : <Info className="h-3.5 w-3.5" />}
                        {statusLabel(item.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="max-w-md text-sm font-bold text-slate-700">{item.title}</p>
                      {item.errorCode && <p className="mt-1 text-xs font-semibold text-red-500">{item.errorCode}</p>}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-500">{item.theme || '—'}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-500">{formatDateTime(item.occurredAt)}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        {item.recipeId && (
                          <Link to={`/admin/receitas/${item.recipeId}`} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 no-underline transition-colors hover:border-[#f76f25]/30 hover:bg-[#f76f25]/5 hover:text-[#f76f25]">
                            Editar
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        )}
                        <Button type="button" variant="outline" onClick={() => setSelected(item)} className="rounded-full">
                          <FileSearch className="mr-2 h-4 w-4" />
                          Ver logs
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-h-[88vh] max-w-3xl overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <div className="mb-2 flex items-center gap-2">
                  <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-black', statusClasses(selected.status))}>
                    {selected.status === 'created' ? <CheckCircle2 className="h-3.5 w-3.5" /> : selected.status === 'failed' ? <AlertCircle className="h-3.5 w-3.5" /> : <Info className="h-3.5 w-3.5" />}
                    {statusLabel(selected.status)}
                  </span>
                  {selected.legacy && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500">legado</span>}
                </div>
                <DialogTitle>{selected.title}</DialogTitle>
                <DialogDescription>Resumo operacional da tentativa de geração da receita.</DialogDescription>
              </DialogHeader>

              <dl className="rounded-2xl border border-slate-200 bg-white px-4">
                <DetailRow label="Data e hora" value={formatDateTime(selected.occurredAt)} />
                <DetailRow label="Categoria" value={selected.theme || '—'} />
                <DetailRow label="Gatilho" value={triggerLabel(selected.triggerType)} />
                <DetailRow label="Status da execução" value={selected.runStatus || '—'} />
                <DetailRow label="Run ID" value={selected.runId || '—'} mono />
                <DetailRow label="Correlation ID" value={selected.correlationId || '—'} mono />
                <DetailRow label="Recipe ID" value={selected.recipeId || '—'} mono />
              </dl>

              {(selected.sourceUrl || selected.canonicalUrl) && (
                <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase tracking-wider text-slate-400">Fonte</p>
                  <a href={selected.canonicalUrl || selected.sourceUrl || '#'} target="_blank" rel="noreferrer" className="mt-2 inline-flex max-w-full items-center gap-1.5 break-all text-sm font-bold text-[#f76f25] hover:underline">
                    {selected.canonicalUrl || selected.sourceUrl}
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  </a>
                </section>
              )}

              {selected.errorMessage && (
                <section className="rounded-2xl border border-red-200 bg-red-50 p-4">
                  <div className="flex items-center gap-2 text-red-700"><AlertCircle className="h-4 w-4" /><p className="text-xs font-black uppercase tracking-wider">Erro</p></div>
                  {selected.errorCode && <p className="mt-3 font-mono text-xs font-bold text-red-700">{selected.errorCode}</p>}
                  <p className="mt-2 whitespace-pre-wrap text-sm font-medium leading-relaxed text-red-700">{selected.errorMessage}</p>
                </section>
              )}

              {selected.geminiUsage && (
                <section className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-black uppercase tracking-wider text-slate-400">Gemini</p>
                  <dl className="mt-2">
                    <DetailRow label="Modelo" value={asText(selected.geminiUsage.model) || '—'} />
                    <DetailRow label="Tokens" value={String(asNumber(selected.geminiUsage.total_tokens) ?? '—')} />
                    <DetailRow label="Custo estimado" value={formatUsd(selected.geminiUsage.estimated_total_cost_usd)} />
                  </dl>
                </section>
              )}

              {selected.coverGeneration && (
                <section className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-black uppercase tracking-wider text-slate-400">Capa com IA</p>
                  <dl className="mt-2">
                    <DetailRow label="Status" value={asText(selected.coverGeneration.status) || '—'} />
                    <DetailRow label="Custo estimado" value={formatUsd(selected.coverGeneration.estimated_cost_usd)} />
                    {asText(selected.coverGeneration.error_message) && <DetailRow label="Erro da capa" value={asText(selected.coverGeneration.error_message) || '—'} />}
                  </dl>
                </section>
              )}

              {selected.runSummary && (
                <section className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-black uppercase tracking-wider text-slate-400">Resumo da execução</p>
                  <dl className="mt-2">
                    <DetailRow label="Solicitadas" value={String(asNumber(selected.runSummary.requested_total) ?? '—')} />
                    <DetailRow label="Resultado" value={asText(selected.runSummary.fulfillment) || '—'} />
                    <DetailRow label="Custo IA total" value={formatUsd(selected.runSummary.estimated_total_ai_cost_usd)} />
                  </dl>
                </section>
              )}

              <div className="flex flex-wrap justify-end gap-2">
                {selected.recipeId && (
                  <Button asChild variant="outline" className="rounded-full">
                    <Link to={`/admin/receitas/${selected.recipeId}`}>Abrir receita<ExternalLink className="ml-2 h-4 w-4" /></Link>
                  </Button>
                )}
                <Button type="button" variant="outline" onClick={() => copyDiagnostic(selected)} className="rounded-full">
                  <Copy className="mr-2 h-4 w-4" />Copiar diagnóstico
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
