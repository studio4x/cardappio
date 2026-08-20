import { useEffect, useMemo, useState } from 'react'
import {
  Bot,
  CalendarDays,
  CheckCircle2,
  Clock3,
  History,
  ImagePlus,
  Loader2,
  Minus,
  Play,
  Plus,
  RefreshCw,
  Save,
  Settings2,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingState } from '@/components/shared/LoadingState'
import { RecipeAutomationHistoryTab } from '@/components/admin/RecipeAutomationHistoryTab'
import { RecipeCoverPendingTab } from '@/components/admin/RecipeCoverPendingTab'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { useRecipeAutomation, type RecipeAutomationConfig } from '@/hooks/admin/useRecipeAutomation'

const DEFAULT_CONFIG: RecipeAutomationConfig = {
  version: 1,
  enabled: false,
  timezone: 'America/Sao_Paulo',
  targets: [],
  schedule: { days_of_week: [1], time: '07:15' },
}

const DAYS = [
  { value: 0, label: 'Dom' }, { value: 1, label: 'Seg' }, { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' }, { value: 4, label: 'Qui' }, { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
]

function formatDateTime(value?: string) {
  if (!value) return '—'
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo',
    }).format(new Date(value))
  } catch {
    return '—'
  }
}

export function AdminRecipeAutomationPage() {
  const { data, isLoading, isFetching, refetch, saveMutation, runNowMutation } = useRecipeAutomation()
  const [form, setForm] = useState<RecipeAutomationConfig>(DEFAULT_CONFIG)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (data?.config) {
      setForm(data.config)
      setInitialized(true)
    }
  }, [data?.config])

  const targetMap = useMemo(
    () => new Map(form.targets.map((target) => [target.category_slug, target.quantity])),
    [form.targets],
  )
  const totalRecipes = useMemo(
    () => form.targets.reduce((total, target) => total + target.quantity, 0),
    [form.targets],
  )

  const maxRecipes = data?.limits?.max_recipes_per_run || 20
  const activeRun = Boolean(data?.runtime?.active_run_id)
  const pendingManual = Boolean(data?.runtime?.manual_request?.id)
  const lastRun = data?.runtime?.last_run
  const lastTotals = lastRun?.summary?.totals

  const updateTarget = (slug: string, quantity: number) => {
    setForm((current) => ({
      ...current,
      targets: quantity <= 0
        ? current.targets.filter((target) => target.category_slug !== slug)
        : [...current.targets.filter((target) => target.category_slug !== slug), { category_slug: slug, quantity }],
    }))
  }

  const toggleDay = (day: number) => {
    setForm((current) => {
      const selected = current.schedule.days_of_week.includes(day)
      return {
        ...current,
        schedule: {
          ...current.schedule,
          days_of_week: selected
            ? current.schedule.days_of_week.filter((value) => value !== day)
            : [...current.schedule.days_of_week, day].sort((a, b) => a - b),
        },
      }
    })
  }

  const canSave = form.schedule.days_of_week.length > 0 && totalRecipes <= maxRecipes && (!form.enabled || totalRecipes > 0)

  if (isLoading || !initialized) return <LoadingState message="Carregando automação de receitas..." />

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title="Automação de Receitas"
        subtitle="Configure a geração automática, acompanhe o histórico e gere imagens de capa com IA."
      />

      <Tabs defaultValue="configuracao" className="gap-6">
        <TabsList variant="pill" className="max-w-full overflow-x-auto">
          <TabsTrigger value="configuracao"><Settings2 className="h-4 w-4" />Configuração</TabsTrigger>
          <TabsTrigger value="historico"><History className="h-4 w-4" />Histórico</TabsTrigger>
          <TabsTrigger value="capas"><ImagePlus className="h-4 w-4" />Capas pendentes</TabsTrigger>
        </TabsList>

        <TabsContent value="configuracao" className="space-y-8">
          <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-slate-400">Programação</p>
                  <p className="mt-2 text-lg font-black text-slate-800">{form.enabled ? 'Ativa' : 'Desativada'}</p>
                </div>
                <button
                  type="button" role="switch" aria-checked={form.enabled}
                  onClick={() => setForm((current) => ({ ...current, enabled: !current.enabled }))}
                  className={cn('relative h-7 w-12 rounded-full transition-colors', form.enabled ? 'bg-[#f76f25]' : 'bg-slate-200')}
                >
                  <span className={cn('absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform', form.enabled ? 'translate-x-6' : 'translate-x-1')} />
                </button>
              </div>
              <p className="mt-3 text-xs text-slate-500">O workflow n8n consulta essa configuração a cada 5 minutos.</p>
            </div>

            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-wider text-slate-400">Estado operacional</p>
              <div className="mt-2 flex items-center gap-2">
                <span className={cn('h-2.5 w-2.5 rounded-full', activeRun ? 'bg-emerald-500' : pendingManual ? 'bg-amber-500' : 'bg-slate-300')} />
                <p className="text-lg font-black text-slate-800">{activeRun ? 'Executando' : pendingManual ? 'Execução solicitada' : 'Aguardando'}</p>
              </div>
              <p className="mt-3 text-xs text-slate-500">
                {activeRun ? `Iniciada em ${formatDateTime(data?.runtime?.active_run_started_at)}` : pendingManual ? 'A solicitação manual será consumida no próximo ciclo.' : 'Nenhuma execução em andamento.'}
              </p>
            </div>

            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-wider text-slate-400">Última execução</p>
              <p className="mt-2 text-lg font-black text-slate-800">{lastRun?.status || 'Sem histórico'}</p>
              <p className="mt-3 text-xs text-slate-500">
                {lastRun ? `${lastTotals?.created || 0} criadas · ${lastTotals?.failed || 0} falhas · ${formatDateTime(lastRun.completed_at)}` : 'A primeira execução aparecerá aqui.'}
              </p>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
            <div className="flex flex-col gap-2 border-b px-6 py-5 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-2"><Bot className="h-5 w-5 text-[#f76f25]" /><h2 className="font-black text-slate-800">Receitas por categoria</h2></div>
                <p className="mt-1 text-xs text-slate-500">Selecione as categorias e a quantidade desejada em cada execução.</p>
              </div>
              <div className={cn('rounded-full px-4 py-2 text-xs font-black', totalRecipes > maxRecipes ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600')}>Total: {totalRecipes} / {maxRecipes}</div>
            </div>
            <div className="divide-y">
              {(data?.categories || []).map((category) => {
                const quantity = targetMap.get(category.slug) || 0
                const selected = quantity > 0
                return (
                  <div key={category.slug} className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <button type="button" onClick={() => updateTarget(category.slug, selected ? 0 : 1)} className="flex items-center gap-3 text-left">
                      <span className={cn('flex h-5 w-5 items-center justify-center rounded-md border', selected ? 'border-[#f76f25] bg-[#f76f25] text-white' : 'border-slate-300 bg-white')}>
                        {selected && <CheckCircle2 className="h-3.5 w-3.5" />}
                      </span>
                      <div><p className="text-sm font-bold text-slate-700">{category.name}</p><p className="text-[11px] text-slate-400">{category.slug}</p></div>
                    </button>
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <Button type="button" variant="outline" size="icon" disabled={!selected} onClick={() => updateTarget(category.slug, Math.max(0, quantity - 1))} className="h-9 w-9 rounded-full"><Minus className="h-4 w-4" /></Button>
                      <div className="w-12 text-center text-sm font-black text-slate-700">{quantity}</div>
                      <Button type="button" variant="outline" size="icon" disabled={totalRecipes >= maxRecipes} onClick={() => updateTarget(category.slug, quantity + 1)} className="h-9 w-9 rounded-full"><Plus className="h-4 w-4" /></Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="space-y-6 rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-[#f76f25]/10 p-2 text-[#f76f25]"><CalendarDays className="h-5 w-5" /></div>
              <div><h2 className="font-black text-slate-800">Programação</h2><p className="text-xs text-slate-500">O horário é interpretado sempre em America/Sao_Paulo.</p></div>
            </div>
            <div>
              <p className="mb-3 text-xs font-black uppercase tracking-wider text-slate-400">Dias da semana</p>
              <div className="flex flex-wrap gap-2">
                {DAYS.map((day) => {
                  const selected = form.schedule.days_of_week.includes(day.value)
                  return <button key={day.value} type="button" onClick={() => toggleDay(day.value)} className={cn('rounded-full border px-4 py-2 text-xs font-bold transition-colors', selected ? 'border-[#f76f25] bg-[#f76f25] text-white' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50')}>{day.label}</button>
                })}
              </div>
            </div>
            <div className="max-w-xs">
              <label className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400"><Clock3 className="h-4 w-4" />Horário</label>
              <input type="time" value={form.schedule.time} onChange={(event) => setForm((current) => ({ ...current, schedule: { ...current.schedule, time: event.target.value } }))} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none focus:border-[#f76f25]" />
            </div>
          </section>

          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-2"><Settings2 className="h-5 w-5 text-slate-400" /><h2 className="font-black text-slate-800">Controle da automação</h2></div>
                <p className="mt-1 text-xs text-slate-500">Salvar altera as próximas execuções. “Executar agora” entra na fila e é reivindicado pelo n8n no próximo ciclo.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={() => refetch()} disabled={isFetching} className="rounded-full"><RefreshCw className={cn('mr-2 h-4 w-4', isFetching && 'animate-spin')} />Atualizar</Button>
                <Button type="button" variant="outline" onClick={() => runNowMutation.mutate()} disabled={runNowMutation.isPending || totalRecipes === 0 || pendingManual} className="rounded-full">
                  {runNowMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}Executar agora
                </Button>
                <Button type="button" onClick={() => canSave && saveMutation.mutate(form)} disabled={!canSave || saveMutation.isPending} className="rounded-full bg-[#f76f25] hover:bg-[#e8621f]">
                  {saveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Salvar configuração
                </Button>
              </div>
            </div>
            {!canSave && <p className="mt-4 text-xs font-semibold text-red-600">Revise a configuração: escolha ao menos um dia, respeite o limite de {maxRecipes} receitas e, se a programação estiver ativa, selecione pelo menos uma categoria.</p>}
          </section>
        </TabsContent>

        <TabsContent value="historico" className="space-y-4">
          <RecipeAutomationHistoryTab
            runs={data?.recent_runs || []}
            generatedRecipes={data?.generated_recipes || []}
            isFetching={isFetching}
            onRefresh={() => refetch()}
          />
        </TabsContent>

        <TabsContent value="capas" className="space-y-4">
          <RecipeCoverPendingTab categories={data?.categories || []} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
