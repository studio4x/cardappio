import { useImpersonation } from '@/hooks/useImpersonation'
import { Eye, Undo2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ImpersonationBanner() {
  const { isImpersonating, impersonatedUser, stopImpersonation, isProcessing } = useImpersonation()

  if (!isImpersonating || !impersonatedUser) return null

  return (
    <div className="sticky top-0 z-[100] w-full bg-gradient-to-r from-amber-950 via-amber-900 to-amber-950 text-amber-100 border-b border-amber-800/60 px-4 py-2 shadow-md">
      <div className="container-app mx-auto flex flex-wrap items-center justify-between gap-2 text-xs md:text-sm">
        <div className="flex items-center gap-2 font-medium">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/20 text-amber-300 animate-pulse">
            <Eye className="h-4 w-4" />
          </div>
          <span>
            Modo Impersonação: Navegando como{' '}
            <strong className="text-white underline underline-offset-2 font-semibold">
              {impersonatedUser.name || impersonatedUser.email}
            </strong>{' '}
            <span className="opacity-80 text-xs">({impersonatedUser.email})</span>
          </span>
        </div>

        <Button
          size="sm"
          variant="secondary"
          onClick={() => stopImpersonation()}
          disabled={isProcessing}
          className="bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold h-8 px-3 shadow transition-all flex items-center gap-1.5 cursor-pointer"
        >
          {isProcessing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Undo2 className="h-3.5 w-3.5" />
          )}
          <span>Voltar para Admin</span>
        </Button>
      </div>
    </div>
  )
}
