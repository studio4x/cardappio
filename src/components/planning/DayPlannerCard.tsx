import { MealSlotCard } from './MealSlotCard'
import type { MealPlanDay } from '@/types/planning'
import { DAY_LABELS, type DayOfWeek } from '@/lib/constants/calendar'
import { cn } from '@/lib/utils'

interface DayPlannerCardProps {
  day: MealPlanDay
  weekId: string
  onRemoveRecipe?: (slotId: string) => void
  isPassed?: boolean
  isToday?: boolean
  formattedDate?: string
}

export function DayPlannerCard({ day, weekId, onRemoveRecipe, isPassed, isToday, formattedDate }: DayPlannerCardProps) {
  const slots = [...(day.slots ?? [])].sort((a, b) => a.sort_order - b.sort_order)
  const isWeekend = day.day_of_week === 'saturday' || day.day_of_week === 'sunday'

  return (
    <div className={cn("space-y-4 transition-all duration-200", isPassed && "opacity-50 saturate-75 hover:opacity-80")}>
      <div className="flex items-center gap-2 px-1">
        <span 
          className={cn("w-1.5 h-6 rounded-full transition-all", isToday ? "scale-y-110" : "")} 
          style={{ 
            backgroundColor: isToday 
              ? 'var(--color-primary)' 
              : (isWeekend ? 'var(--color-tertiary)' : 'var(--color-fresh-green)') 
          }}
        ></span>
        <h3 className="text-lg font-extrabold text-on-surface flex items-baseline gap-2">
          <span>{DAY_LABELS[day.day_of_week as DayOfWeek]}</span>
          {formattedDate && (
            <span className={cn("text-xs font-bold", isToday ? "text-primary" : "text-neutral-400")}>
              • {formattedDate}
            </span>
          )}
          {isToday && (
            <span className="text-[10px] font-black uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-md ml-1">
              Hoje
            </span>
          )}
        </h3>
      </div>

      <div className="grid gap-3">
        {slots.map((slot) => (
          <MealSlotCard key={slot.id} slot={slot} weekId={weekId} onRemove={onRemoveRecipe} />
        ))}
      </div>
    </div>
  )
}
