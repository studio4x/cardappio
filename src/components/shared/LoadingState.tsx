import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingStateProps {
  message?: string
  fullScreen?: boolean
  className?: string
}

export function LoadingState({
  message = 'Carregando...',
  fullScreen = false,
  className,
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3',
        fullScreen ? 'min-h-screen' : 'py-16',
        className
      )}
    >
      <Loader2
        className="h-8 w-8 animate-spin"
        style={{ color: 'var(--color-primary-light)' }}
      />
      {message && (
        <p
          className="text-sm"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {message}
        </p>
      )}
    </div>
  )
}
