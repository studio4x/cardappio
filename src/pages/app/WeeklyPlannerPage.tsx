import { useState, useMemo } from 'react'
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom'
import { Plus, ShoppingCart, Loader2, Save, SlidersVertical as Tune, ChevronRight, ChevronDown } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { useActiveWeek, useCreateWeek, useWeek, useWeeks, useRepeatWeek } from '@/hooks/planning/usePlanning'
import { useProfile } from '@/hooks/auth'
import { DayPlannerCard } from '@/components/planning/DayPlannerCard'
import { DAY_LABELS, DAY_ORDER as ALL_DAYS, type DayOfWeek } from '@/lib/constants/calendar'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

export function WeeklyPlannerPage() {
  const navigate = useNavigate()
  const { weekId: routeWeekId } = useParams()
  const { pathname } = useLocation()
  const { preferences } = useProfile()
  
  const createWeek = useCreateWeek()
  const repeatWeek = useRepeatWeek()
  const { data: weeks } = useWeeks()
  
  const { data: activeWeekData, isLoading: isActiveLoading, error: activeError, refetch: refetchActive } = useActiveWeek()
  
  const isCreatingNew = pathname === '/app/semana/nova'
  const shouldQuerySpecificWeek = !!routeWeekId && !isCreatingNew && routeWeekId !== activeWeekData?.id
  
  const { data: specificWeekData, isLoading: isSpecificLoading, error: specificError, refetch: refetchSpecific } = useWeek(
    shouldQuerySpecificWeek ? routeWeekId : undefined
  )
  
  const activeWeek = isCreatingNew ? null : (shouldQuerySpecificWeek ? specificWeekData : activeWeekData)
  const isLoading = isActiveLoading || (shouldQuerySpecificWeek && isSpecificLoading)
  const error = shouldQuerySpecificWeek ? specificError : activeError
  const refetch = shouldQuerySpecificWeek ? refetchSpecific : refetchActive

  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>(
    ALL_DAYS.slice(0, preferences?.default_plan_days ?? 5)
  )

  const mealModes = useMemo(() => {
    if (!preferences?.default_meal_modes) return ['lunch', 'dinner']
    const modes = preferences.default_meal_modes
    return Array.isArray(modes) ? modes : ['lunch', 'dinner']
  }, [preferences])

  const todayFormatted = useMemo(() => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' }
    const dateStr = new Date().toLocaleDateString('pt-BR', options)
    return dateStr.charAt(0).toUpperCase() + dateStr.slice(1)
  }, [])

  const formatDateToShort = (dateStr: string) => {
    if (!dateStr) return ''
    const d = new Date(dateStr + 'T12:00:00')
    return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
  }

  const handleCreateNextWeek = async () => {
    let baseDate = new Date()
    
    if (activeWeek) {
      const currentEnd = new Date(activeWeek.week_end_date + 'T12:00:00')
      const today = new Date()
      if (currentEnd >= today) {
        baseDate = currentEnd
      }
    }
    
    const dayOfWeek = baseDate.getDay()
    const daysToNextMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek
    
    const nextStart = new Date(baseDate)
    nextStart.setDate(baseDate.getDate() + daysToNextMonday)
    
    const nextEnd = new Date(nextStart)
    nextEnd.setDate(nextStart.getDate() + 6)
    
    const startDateStr = nextStart.toISOString().split('T')[0]
    const endDateStr = nextEnd.toISOString().split('T')[0]
    
    try {
      const week = await createWeek.mutateAsync({ 
        startDate: startDateStr, 
        endDate: endDateStr, 
        selectedDays, 
        mealModes 
      })
      if (week) {
        navigate(`/app/semana/${week.id}`)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleRepeatWeek = async (weekId: string) => {
    try {
      const week = await repeatWeek.mutateAsync(weekId)
      if (week) {
        navigate(`/app/semana/${week.id}`)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const getDayOfMonth = (startDateStr: string, sortOrder: number) => {
    try {
      const baseDate = new Date(startDateStr + 'T12:00:00')
      const dayOfWeek = baseDate.getDay()
      const diff = baseDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
      const monday = new Date(baseDate.setDate(diff))
      monday.setDate(monday.getDate() + sortOrder)
      return monday.getDate()
    } catch {
      return 12 + sortOrder
    }
  }

  if (isLoading) return <LoadingState message="Carregando planejador..." />
  if (error) return <ErrorState onRetry={() => refetch()} />

  if (!activeWeek) {
     return (
        <div className="max-w-2xl mx-auto px-5 pt-8 pb-32">
          <PageHeader title="Montar Semana" subtitle="Selecione os dias que deseja planejar." />
          <div className="bg-white rounded-3xl border p-6 space-y-6">
             <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {ALL_DAYS.map((day) => (
                  <button
                    key={day}
                    onClick={() => setSelectedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])}
                    className={cn(
                      "rounded-2xl border px-4 py-4 text-xs font-bold transition-all uppercase tracking-widest",
                      selectedDays.includes(day) ? "bg-emerald-50 border-primary text-primary" : "bg-neutral-50 border-transparent text-neutral-400"
                    )}
                  >
                    {DAY_LABELS[day].substring(0, 3)}
                  </button>
                ))}
             </div>
             <Button 
                onClick={async () => {
                  const today = new Date()
                  const dayOfWeek = today.getDay()
                  const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
                  const monday = new Date(today.setDate(diff))
                  const sunday = new Date(monday.getTime() + 6 * 24 * 60 * 60 * 1000)
                  
                  const week = await createWeek.mutateAsync({ 
                    startDate: monday.toISOString().split('T')[0], 
                    endDate: sunday.toISOString().split('T')[0], 
                    selectedDays, 
                    mealModes 
                  })
                  if(week) navigate(`/app/semana/${week.id}`)
                }} 
                disabled={selectedDays.length === 0}
                className="w-full py-6 rounded-2xl text-lg font-bold"
             >
                Começar Planejamento
             </Button>
          </div>
        </div>
     )
  }

  const sortedDays = [...(activeWeek.days ?? [])].sort((a, b) => a.sort_order - b.sort_order)

  return (
    <div className="bg-surface min-h-screen pb-32">
      <main className="max-w-2xl mx-auto px-5 pt-8 space-y-10">
        
        {/* Today's orientation banner */}
        <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-primary">Hoje é</p>
              <p className="text-sm font-extrabold text-on-surface">{todayFormatted}</p>
            </div>
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest text-secondary bg-secondary/10 px-2.5 py-1 rounded-lg">
            Guia do Dia
          </span>
        </div>
        
        {/* Week Header */}
        <section className="flex flex-col gap-6">
          <div className="flex justify-between items-end">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-warm-gray-medium mb-1 block">
                {activeWeek.status === 'active' ? 'SEMANA ATIVA' : 'SEMANA ARQUIVADA'}
              </span>
              
              {/* Week Selector Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 text-3xl font-extrabold text-on-surface tracking-tight hover:opacity-80 transition-opacity text-left cursor-pointer">
                    <span>Meu Planejamento</span>
                    <ChevronDown className="h-6 w-6 text-primary shrink-0" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64 rounded-2xl border border-neutral-100 shadow-lg bg-white p-2 z-50">
                  <div className="px-2 py-1.5 text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Selecionar Semana
                  </div>
                  {weeks?.map((w) => {
                    const isCurrent = w.id === activeWeek.id
                    return (
                      <DropdownMenuItem
                        key={w.id}
                        onClick={() => navigate(`/app/semana/${w.id}`)}
                        className={cn(
                          "rounded-xl px-3 py-2 text-sm cursor-pointer transition-colors focus:bg-neutral-50",
                          isCurrent 
                            ? "bg-primary/10 text-primary font-bold focus:bg-primary/15" 
                            : "hover:bg-neutral-50 text-on-surface"
                        )}
                      >
                        <div className="flex flex-col">
                          <span>
                            {formatDateToShort(w.week_start_date)} a {formatDateToShort(w.week_end_date)}
                          </span>
                          {w.status === 'active' && (
                            <span className="text-[9px] uppercase tracking-wider text-primary font-bold mt-0.5">
                              Ativa
                            </span>
                          )}
                        </div>
                      </DropdownMenuItem>
                    )
                  })}
                  {(!weeks || weeks.length === 0) && (
                    <div className="px-3 py-2 text-xs text-neutral-400">
                      Nenhuma semana encontrada
                    </div>
                  )}
                  <DropdownMenuSeparator className="my-1 bg-neutral-100" />
                  <DropdownMenuItem
                    onClick={() => navigate('/app/semana/nova')}
                    className="rounded-xl px-3 py-2 text-sm text-primary font-bold cursor-pointer hover:bg-neutral-50 focus:bg-neutral-50"
                  >
                    + Nova Semana
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Options Dropdown Button */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-3 bg-neutral-100 hover:bg-neutral-200 rounded-2xl transition-colors cursor-pointer">
                  <Tune className="h-5 w-5 text-on-surface-variant" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl border border-neutral-100 shadow-lg bg-white p-2 z-50">
                <div className="px-2 py-1.5 text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Opções do Plano
                </div>
                
                <DropdownMenuItem
                  onClick={handleCreateNextWeek}
                  className="rounded-xl px-3 py-2 text-sm cursor-pointer hover:bg-neutral-50 focus:bg-neutral-50 flex items-center gap-2"
                >
                  <Plus className="h-4 w-4 text-primary" />
                  <span>Planejar Próxima Semana</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => handleRepeatWeek(activeWeek.id)}
                  className="rounded-xl px-3 py-2 text-sm cursor-pointer hover:bg-neutral-50 focus:bg-neutral-50 flex items-center gap-2"
                >
                  <Save className="h-4 w-4 text-secondary" />
                  <span>Repetir Esta Semana</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-1 bg-neutral-100" />

                <DropdownMenuItem
                  onClick={() => navigate('/app/historico')}
                  className="rounded-xl px-3 py-2 text-sm cursor-pointer hover:bg-neutral-50 focus:bg-neutral-50 flex items-center gap-2"
                >
                  <span>Ver Histórico</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Horizontal Day Scroller */}
          <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
            {sortedDays.map((day, idx) => (
              <div 
                key={day.id}
                className={cn(
                  "flex-shrink-0 flex flex-col items-center justify-center w-16 h-24 rounded-3xl transition-all duration-300 border-2",
                  idx === 0 
                    ? "bg-primary border-primary text-white shadow-xl shadow-primary/20 ring-4 ring-primary/10" 
                    : "bg-white border-neutral-100 text-on-surface"
                )}
              >
                <span className={cn("text-[10px] font-bold uppercase tracking-widest", idx === 0 ? "opacity-80" : "text-warm-gray-medium")}>
                  {DAY_LABELS[day.day_of_week as DayOfWeek].substring(0, 3)}
                </span>
                <span className="text-xl font-black mt-1">
                  {getDayOfMonth(activeWeek.week_start_date, day.sort_order)}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Daily Slots */}
        <div className="space-y-12">
          {sortedDays.map((day) => (
            <DayPlannerCard key={day.id} day={day} weekId={activeWeek.id} />
          ))}
        </div>

        {/* FAB */}
        <button className="fixed bottom-24 right-6 w-16 h-16 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-transform duration-150 z-40">
           <Save className="h-8 w-8" />
        </button>

        {/* CTA to Shopping List */}
        <div className="pt-10">
           <Link 
            to={`/app/semana/${activeWeek.id}/compras`}
            className="flex items-center justify-between bg-neutral-900 text-white p-6 rounded-3xl group"
           >
              <div className="flex items-center gap-4">
                 <div className="bg-white/10 p-3 rounded-2xl">
                    <ShoppingCart className="h-6 w-6" />
                 </div>
                 <div>
                    <p className="font-bold">Gerar Lista de Compras</p>
                    <p className="text-xs text-white/60">Baseado nas receitas planejadas acima.</p>
                 </div>
              </div>
              <ChevronRight className="h-5 w-5 text-white/40 group-hover:translate-x-1 transition-transform" />
           </Link>
        </div>
      </main>
    </div>
  )
}
