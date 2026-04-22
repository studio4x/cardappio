import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, ShoppingCart, Loader2, Save, SlidersVertical as Tune, ChevronRight } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { useActiveWeek, useCreateWeek } from '@/hooks/planning/usePlanning'
import { useProfile } from '@/hooks/auth'
import { DayPlannerCard } from '@/components/planning/DayPlannerCard'
import { DAY_LABELS, DAY_ORDER as ALL_DAYS, type DayOfWeek } from '@/lib/constants/calendar'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export function WeeklyPlannerPage() {
  const navigate = useNavigate()
  const { data: activeWeek, isLoading, error, refetch } = useActiveWeek()
  const { preferences } = useProfile()
  const createWeek = useCreateWeek()

  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>(
    ALL_DAYS.slice(0, preferences?.default_plan_days ?? 5)
  )

  const mealModes = useMemo(() => {
    if (!preferences?.default_meal_modes) return ['lunch', 'dinner']
    const modes = preferences.default_meal_modes
    return Array.isArray(modes) ? modes : ['lunch', 'dinner']
  }, [preferences])

  if (isLoading) return <LoadingState message="Carregando planejador..." />
  if (error) return <ErrorState onRetry={() => refetch()} />

  if (!activeWeek) {
     // ... creation flow remains similar but styled ...
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
                  const week = await createWeek.mutateAsync({ 
                    startDate: new Date().toISOString().split('T')[0], 
                    endDate: new Date().toISOString().split('T')[0], 
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
        
        {/* Week Header */}
        <section className="flex flex-col gap-6">
          <div className="flex justify-between items-end">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-warm-gray-medium mb-1 block">ESTA SEMANA</span>
              <h2 className="text-3xl font-extrabold text-on-surface tracking-tight">Meu Planejamento</h2>
            </div>
            <button className="p-3 bg-neutral-100 hover:bg-neutral-200 rounded-2xl transition-colors">
              <Tune className="h-5 w-5 text-on-surface-variant" />
            </button>
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
                  {idx + 12} {/* Dummy date for mockup feel */}
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

        {/* CTA to Shopping List (Desktop/Large Mobile) */}
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


