import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 py-16 px-6 text-center',
        className
      )}
    >
      {icon && (
        <div
          className="flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{ backgroundColor: 'var(--color-surface-container)' }}
        >
          <div style={{ color: 'var(--color-outline)' }}>{icon}</div>
        </div>
      )}
      <div className="space-y-1.5">
        <h3
          className="text-lg font-semibold"
          style={{ color: 'var(--color-on-surface)' }}
        >
          {title}
        </h3>
        {description && (
          <p
            className="max-w-sm text-sm leading-relaxed"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {description}
          </p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
