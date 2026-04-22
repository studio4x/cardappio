import { MealSlotCard } from './MealSlotCard'
import type { MealPlanDay } from '@/types/planning'
import { DAY_LABELS, type DayOfWeek } from '@/lib/constants/calendar'

interface DayPlannerCardProps {
  day: MealPlanDay
  weekId: string
}

export function DayPlannerCard({ day, weekId }: DayPlannerCardProps) {
  const slots = [...(day.slots ?? [])].sort((a, b) => a.sort_order - b.sort_order)
  const isWeekend = day.day_of_week === 'saturday' || day.day_of_week === 'sunday'

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-1">
        <span className="w-1.5 h-6 rounded-full" style={{ backgroundColor: isWeekend ? 'var(--color-tertiary)' : 'var(--color-fresh-green)' }}></span>
        <h3 className="text-lg font-extrabold text-on-surface">
          {DAY_LABELS[day.day_of_week as DayOfWeek]}
        </h3>
      </div>

      <div className="grid gap-3">
        {slots.map((slot) => (
          <MealSlotCard key={slot.id} slot={slot} weekId={weekId} />
        ))}
      </div>
    </div>
  )
}
