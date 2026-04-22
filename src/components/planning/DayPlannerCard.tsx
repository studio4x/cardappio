import { MealSlotCard } from './MealSlotCard'
import type { MealPlanDay } from '@/types/planning'
import { DAY_LABELS, type DayOfWeek } from '@/lib/constants/calendar'

interface DayPlannerCardProps {
  day: MealPlanDay
  weekId: string
}

export function DayPlannerCard({ day, weekId }: DayPlannerCardProps) {
  const slots = [...(day.slots ?? [])].sort((a, b) => a.sort_order - b.sort_order)

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{
        backgroundColor: 'var(--color-surface-container-lowest)',
        borderColor: 'var(--color-outline-variant)',
      }}
    >
      <div
        className="px-4 py-3 border-b"
        style={{
          backgroundColor: 'var(--color-surface-container-low)',
          borderColor: 'var(--color-outline-variant)',
        }}
      >
        <h3 className="text-sm font-semibold" style={{ color: 'var(--color-on-surface)' }}>
          {DAY_LABELS[day.day_of_week as DayOfWeek]}
        </h3>
      </div>

      <div className="divide-y" style={{ borderColor: 'var(--color-outline-variant)' }}>
        {slots.map((slot) => (
          <MealSlotCard key={slot.id} slot={slot} weekId={weekId} />
        ))}
      </div>
    </div>
  )
}
