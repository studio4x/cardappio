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
        "flex items-center gap-3 px-5 py-4 transition-all duration-300 group active:bg-surface",
        item.is_checked ? "opacity-80" : "bg-transparent"
      )}
    >
      <button
        onClick={() => onToggle(item.id, item.is_checked)}
        className={cn(
          'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 cursor-pointer active:scale-90',
          item.is_checked 
            ? 'bg-fresh-green border-fresh-green shadow-sm' 
            : 'bg-white border-warm-gray-medium hover:border-fresh-green'
        )}
      >
        {item.is_checked && <Check className="h-3.5 w-3.5 text-white animate-in zoom-in duration-200" strokeWidth={4} />}
      </button>
      <div className="flex-1 min-w-0" onClick={() => onToggle(item.id, item.is_checked)}>
        <p
          className={cn(
            'text-sm font-medium transition-all duration-300 cursor-pointer select-none',
            item.is_checked ? 'line-through text-warm-gray-medium' : 'text-on-surface'
          )}
        >
          {item.ingredient_label}
        </p>
      </div>
      {item.quantity_label && (
        <span className={cn(
          "text-xs font-bold font-label-md transition-colors",
          item.is_checked ? "text-warm-gray-medium opacity-50" : "text-warm-gray-medium"
        )}>
          {item.quantity_label}
        </span>
      )}
    </li>
  )
}
