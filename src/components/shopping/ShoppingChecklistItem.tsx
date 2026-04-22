import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ShoppingListItem } from '@/types/shopping'

interface ShoppingChecklistItemProps {
  item: ShoppingListItem
  onToggle: (id: string, currentChecked: boolean) => void
}

export function ShoppingChecklistItem({ item, onToggle }: ShoppingChecklistItemProps) {
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <button
        onClick={() => onToggle(item.id, item.is_checked)}
        className={cn(
          'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors cursor-pointer',
        )}
        style={{
          borderColor: item.is_checked ? 'var(--color-primary)' : 'var(--color-outline-variant)',
          backgroundColor: item.is_checked ? 'var(--color-primary)' : 'transparent',
        }}
      >
        {item.is_checked && <Check className="h-3 w-3 text-white" />}
      </button>
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm font-medium transition-all',
            item.is_checked && 'line-through opacity-50',
          )}
          style={{ color: 'var(--color-on-surface)' }}
        >
          {item.ingredient_label}
        </p>
        {item.quantity_label && (
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            {item.quantity_label}
          </p>
        )}
      </div>
      {item.source_recipe_count > 1 && (
        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
          style={{
            backgroundColor: 'var(--color-surface-container)',
            color: 'var(--color-text-secondary)',
          }}
        >
          {item.source_recipe_count} receitas
        </span>
      )}
    </li>
  )
}
