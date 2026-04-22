import { Link } from 'react-router-dom'
import { Clock, Star, Sync, Trash2, Plus, Utensils } from 'lucide-react'
import type { MealPlanSlot } from '@/types/planning'
import { cn } from '@/lib/utils'

interface MealSlotCardProps {
  slot: MealPlanSlot
  weekId: string
  onRemove?: (slotId: string) => void
}

export function MealSlotCard({ slot, weekId, onRemove }: MealSlotCardProps) {
  const isLunch = slot.meal_type === 'lunch'
  const mealLabel = isLunch ? 'ALMOÇO' : 'JANTAR'
  const labelColor = isLunch ? 'text-fresh-green' : 'text-warm-terracotta'

  if (!slot.recipe) {
    return (
      <Link
        to={`/app/receitas?slot=${slot.id}&week=${weekId}`}
        className="block"
      >
        <div className="border-2 border-dashed border-neutral-200 rounded-2xl bg-neutral-50/50 p-4 flex items-center justify-between group hover:border-fresh-green hover:bg-green-50/30 transition-all cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-neutral-300 group-hover:text-fresh-green transition-colors shadow-sm">
              <Plus className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-warm-gray-medium uppercase tracking-widest leading-none block mb-1">
                {mealLabel}
              </span>
              <p className="text-sm font-medium text-neutral-400">Adicionar receita...</p>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <div className="relative group">
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden flex transition-transform active:scale-[0.98]">
        <div className="w-24 h-24 flex-shrink-0 bg-neutral-100">
          {slot.recipe.cover_image_url && (
            <img
              src={slot.recipe.cover_image_url}
              alt={slot.recipe.title}
              className="w-full h-full object-cover"
            />
          )}
        </div>
        <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
          <div>
            <div className="flex justify-between items-start">
              <span className={cn("text-[10px] font-bold uppercase tracking-widest mb-1", labelColor)}>
                {mealLabel}
              </span>
              <div className="flex gap-2">
                <button 
                  className="text-warm-gray-medium hover:text-primary transition-colors active:scale-90"
                  title="Trocar"
                >
                  <Sync className="h-3.5 w-3.5" />
                </button>
                <button 
                  onClick={(e) => {
                    e.preventDefault()
                    onRemove?.(slot.id)
                  }}
                  className="text-red-300 hover:text-red-500 transition-colors active:scale-90"
                  title="Remover"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            
            <Link to={`/app/receitas/${slot.recipe.slug}`} className="block group">
              <h4 className="text-sm font-bold text-on-surface line-clamp-1 group-hover:text-primary transition-colors">
                {slot.recipe.title}
              </h4>
            </Link>

            <div className="flex gap-3 mt-1.5">
              <div className="flex items-center gap-1 text-[11px] font-medium text-warm-gray-medium">
                <Clock className="h-3 w-3" />
                {slot.recipe.prep_time_minutes} min
              </div>
              <div className="flex items-center gap-1 text-[11px] font-medium text-warm-gray-medium font-label-sm">
                <Star className="h-3 w-3 text-warning-amber fill-warning-amber" />
                {slot.recipe.difficulty === 'easy' ? 'Fácil' : slot.recipe.difficulty === 'medium' ? 'Médio' : 'Difícil'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
