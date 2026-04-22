import { Link } from 'react-router-dom'
import { Clock, ChefHat } from 'lucide-react'
import type { MealPlanSlot } from '@/types/planning'

interface MealSlotCardProps {
  slot: MealPlanSlot
  weekId: string
}

export function MealSlotCard({ slot, weekId }: MealSlotCardProps) {
  const mealLabel = slot.meal_type === 'lunch' ? '🍽️ Almoço' : '🌙 Jantar'

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="text-xs font-medium w-20 shrink-0" style={{ color: 'var(--color-text-secondary)' }}>
        {mealLabel}
      </span>

      {slot.recipe ? (
        <Link
          to={`/app/receitas/${slot.recipe.slug}`}
          className="flex flex-1 items-center gap-3 rounded-lg p-2 transition-colors hover:opacity-80 no-underline min-w-0"
          style={{ color: 'var(--color-on-surface)' }}
        >
          {slot.recipe.cover_image_url && (
            <img
              src={slot.recipe.cover_image_url}
              alt={slot.recipe.title}
              className="h-10 w-10 rounded-lg object-cover shrink-0"
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{slot.recipe.title}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <Clock className="h-3 w-3" style={{ color: 'var(--color-outline)' }} />
              <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                {slot.recipe.prep_time_minutes} min
              </span>
            </div>
          </div>
        </Link>
      ) : (
        <Link
          to={`/app/receitas?slot=${slot.id}&week=${weekId}`}
          className="flex flex-1 items-center gap-2 rounded-lg border border-dashed px-4 py-3 text-sm font-medium transition-colors hover:opacity-80 no-underline"
          style={{
            borderColor: 'var(--color-outline-variant)',
            color: 'var(--color-primary)',
          }}
        >
          <ChefHat className="h-4 w-4" />
          Escolher receita
        </Link>
      )}
    </div>
  )
}
