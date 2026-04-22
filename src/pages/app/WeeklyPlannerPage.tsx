import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CalendarDays, Plus, ShoppingCart, Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { useActiveWeek, useCreateWeek } from '@/hooks/planning/usePlanning'
import { useProfile } from '@/hooks/auth'
import { DayPlannerCard } from '@/components/planning/DayPlannerCard'
import { DAY_LABELS, DAY_ORDER as ALL_DAYS, type DayOfWeek } from '@/lib/constants/calendar'

function getNextMonday(): string {
  const d = new Date()
  const day = d.getDay()
  const diff = day === 0 ? 1 : 8 - day
  d.setDate(d.getDate() + diff)
  return d.toISOString().split('T')[0]
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

/**
 * WeeklyPlannerPage
 *
 * Per SCREENS.md (Screen 07/08) and CODEX_CARDAPPIO_APP_SPEC.md:
 * - Shows active week or creation flow
 * - Each day shows lunch/dinner slots
 * - User can pick recipes for each slot
 * - CTA to generate shopping list
 */
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
    // Ensure it's an array
    const modes = preferences.default_meal_modes
    return Array.isArray(modes) ? modes : ['lunch', 'dinner']
  }, [preferences])

  const handleCreateWeek = async () => {
    const startDate = getNextMonday()
    const endDate = addDays(startDate, 6)

    try {
      const week = await createWeek.mutateAsync({
        startDate,
        endDate,
        selectedDays,
        mealModes,
      })
      if (week) {
        navigate(`/app/semana/${week.id}`)
      }
    } catch (err) {
      console.error('Error creating week:', err)
    }
  }

  const toggleDay = (day: DayOfWeek) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  if (isLoading) return <LoadingState message="Carregando sua semana..." />
  if (error) return <ErrorState onRetry={() => refetch()} />

  // No active week — show creation flow
  if (!activeWeek) {
    return (
      <div>
        <PageHeader
          title="Montar minha semana"
          subtitle="Selecione os dias que deseja planejar."
        />

        <div
          className="rounded-2xl border p-6"
          style={{
            backgroundColor: 'var(--color-surface-container-lowest)',
            borderColor: 'var(--color-outline-variant)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <h3
            className="mb-4 text-lg font-semibold"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-on-surface)' }}
          >
            Quais dias planejar?
          </h3>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 mb-6">
            {ALL_DAYS.map((day) => (
              <button
                key={day}
                onClick={() => toggleDay(day)}
                className="rounded-xl border px-4 py-3 text-sm font-medium transition-all cursor-pointer"
                style={{
                  borderColor: selectedDays.includes(day) ? 'var(--color-primary)' : 'var(--color-outline-variant)',
                  backgroundColor: selectedDays.includes(day)
                    ? 'color-mix(in srgb, var(--color-primary) 8%, transparent)'
                    : 'transparent',
                  color: selectedDays.includes(day) ? 'var(--color-primary)' : 'var(--color-on-surface-variant)',
                }}
              >
                {DAY_LABELS[day]}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {selectedDays.length} dia{selectedDays.length !== 1 ? 's' : ''} selecionado{selectedDays.length !== 1 ? 's' : ''}
              {' · '}
              {mealModes.includes('lunch') && mealModes.includes('dinner') ? 'Almoço e jantar' :
                mealModes.includes('lunch') ? 'Apenas almoço' : 'Apenas jantar'}
            </p>
            <button
              onClick={handleCreateWeek}
              disabled={selectedDays.length === 0 || createWeek.isPending}
              className="inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 cursor-pointer"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              {createWeek.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Criar semana
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Active week exists — show planner grid
  const sortedDays = [...(activeWeek.days ?? [])].sort((a, b) => a.sort_order - b.sort_order)

  return (
    <div>
      <PageHeader
        title="Minha Semana"
        subtitle={`${activeWeek.week_start_date} — ${activeWeek.week_end_date}`}
        actions={
          <Link
            to={`/app/semana/${activeWeek.id}/compras`}
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white no-underline transition-all hover:opacity-90"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            <ShoppingCart className="h-4 w-4" />
            Lista de compras
          </Link>
        }
      />

      <div className="space-y-4">
        {sortedDays.map((day) => (
          <DayPlannerCard key={day.id} day={day} weekId={activeWeek.id} />
        ))}
      </div>
    </div>
  )
}


