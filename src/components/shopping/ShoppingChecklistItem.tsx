import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ShoppingListItem } from '@/types/shopping'

interface ShoppingChecklistItemProps {
  item: ShoppingListItem
  onToggle: (id: string, currentChecked: boolean) => void
}

export function ShoppingChecklistItem({ item, onToggle }: ShoppingChecklistItemProps) {
  return (
    <li 
      className={cn(
        "flex items-center gap-3 px-5 py-4 transition-all duration-300",
        item.is_checked ? "bg-emerald-50/50" : "bg-transparent"
      )}
    >
      <button
        onClick={() => onToggle(item.id, item.is_checked)}
        className={cn(
          'flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition-all duration-200 cursor-pointer active:scale-90',
          item.is_checked ? 'bg-emerald-600 border-emerald-600 shadow-sm' : 'bg-white border-slate-200 hover:border-emerald-300'
        )}
      >
        {item.is_checked && <Check className="h-4 w-4 text-white animate-in zoom-in duration-200" />}
      </button>
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-base font-bold transition-all duration-300',
            item.is_checked ? 'line-through text-slate-400 opacity-60' : 'text-slate-900'
          )}
        >
          {item.ingredient_label}
        </p>
        {item.quantity_label && (
          <p className={cn(
            "text-xs font-medium mt-0.5 transition-colors",
            item.is_checked ? "text-slate-300" : "text-slate-500"
          )}>
            {item.quantity_label}
          </p>
        )}
      </div>
      {item.source_recipe_count > 1 && (
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-tight transition-all",
            item.is_checked 
              ? "bg-slate-100 text-slate-400 opacity-50" 
              : "bg-emerald-100 text-emerald-700"
          )}
        >
          {item.source_recipe_count} rec
        </span>
      )}
    </li>
  )
}
