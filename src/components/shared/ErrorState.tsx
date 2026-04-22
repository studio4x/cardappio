import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({
  title = 'Algo deu errado',
  message = 'Não foi possível carregar os dados. Tente novamente.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 py-16 px-6 text-center',
        className
      )}
    >
      <div
        className="flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{ backgroundColor: 'color-mix(in srgb, var(--color-error) 10%, transparent)' }}
      >
        <AlertTriangle className="h-8 w-8" style={{ color: 'var(--color-error)' }} />
      </div>
      <div className="space-y-1.5">
        <h3
          className="text-lg font-semibold"
          style={{ color: 'var(--color-on-surface)' }}
        >
          {title}
        </h3>
        <p
          className="max-w-sm text-sm leading-relaxed"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {message}
        </p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90 cursor-pointer"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          Tentar novamente
        </button>
      )}
    </div>
  )
}
