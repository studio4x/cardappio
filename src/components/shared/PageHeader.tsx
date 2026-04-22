import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  className?: string
}

export function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4 pb-6', className)}>
      <div className="min-w-0 flex-1">
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-on-surface)' }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            className="mt-1 text-sm"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}
