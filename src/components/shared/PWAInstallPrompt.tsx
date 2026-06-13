import { useEffect, useState } from 'react'
import { Download, Share, Plus, X } from 'lucide-react'
import { usePWA } from '@/hooks/usePWA'

export function PWAInstallPrompt() {
  const { isInstallable, isInstalled, isIOS, install } = usePWA()
  const [showPrompt, setShowPrompt] = useState(false)
  const [showIosInstructions, setShowIosInstructions] = useState(false)

  useEffect(() => {
    // If the app is already installed, don't show the prompt
    if (isInstalled) {
      setShowPrompt(false)
      return
    }

    const dismissedTime = localStorage.getItem('pwa-prompt-dismissed')
    const now = Date.now()
    const sevenDays = 7 * 24 * 60 * 60 * 1000

    if (dismissedTime && now - parseInt(dismissedTime, 10) < sevenDays) {
      return
    }

    // Show prompt if installable natively or if it is iOS (and not installed)
    if (isInstallable || (isIOS && !isInstalled)) {
      const timer = setTimeout(() => setShowPrompt(true), 3000) // 3 seconds delay for smooth UX
      return () => clearTimeout(timer)
    }
  }, [isInstallable, isInstalled, isIOS])

  const handleDismiss = () => {
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString())
    setShowPrompt(false)
  }

  const handleInstall = async () => {
    if (isIOS) {
      setShowIosInstructions(true)
    } else {
      const installed = await install()
      if (installed) {
        setShowPrompt(false)
      }
    }
  }

  if (!showPrompt) return null

  return (
    <>
      {/* Installation Banner */}
      <div 
        className="fixed bottom-20 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 translate-y-0 rounded-2xl border p-4 shadow-2xl transition-all duration-500 animate-in slide-in-from-bottom-8 md:bottom-6"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(16px)',
          borderColor: 'var(--color-outline-variant)',
        }}
      >
        <button 
          onClick={handleDismiss}
          className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground hover:bg-neutral-100 hover:text-foreground transition-colors"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex gap-3 pr-6">
          <div 
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white shadow-md"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            <Download className="h-6 w-6" />
          </div>

          <div className="flex flex-col gap-1">
            <h3 className="font-heading text-sm font-bold" style={{ color: 'var(--color-on-surface)' }}>
              Instalar o Cardappio
            </h3>
            <p className="font-body text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              Adicione o Cardappio à sua tela de início para planejar refeições e ver receitas de forma rápida e offline!
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end gap-3">
          <button
            onClick={handleDismiss}
            className="rounded-xl px-4 py-2 text-xs font-semibold hover:bg-neutral-100 transition-colors"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Mais tarde
          </button>
          
          <button
            onClick={handleInstall}
            className="rounded-xl px-5 py-2 text-xs font-bold text-white shadow-sm transition-all hover:brightness-105 active:scale-95 cursor-pointer"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {isIOS ? 'Como Instalar' : 'Instalar'}
          </button>
        </div>
      </div>

      {/* iOS Instructions Drawer Overlay */}
      {showIosInstructions && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-xs animate-in fade-in duration-300">
          <div 
            className="w-full max-w-md rounded-t-3xl border-t p-6 shadow-2xl animate-in slide-in-from-bottom-full duration-300"
            style={{
              backgroundColor: 'var(--color-card)',
              borderColor: 'var(--color-outline-variant)',
            }}
          >
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-neutral-200" />
            
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-heading text-lg font-bold" style={{ color: 'var(--color-on-surface)' }}>
                Instalar no iPhone / iPad
              </h3>
              <button 
                onClick={() => setShowIosInstructions(false)}
                className="rounded-full p-1 text-muted-foreground hover:bg-neutral-100 hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="font-body text-sm mb-6 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              Como o Safari do iOS não permite instalação automática, siga estes passos simples para ter o Cardappio como app:
            </p>

            <div className="flex flex-col gap-4 mb-6">
              <div className="flex items-start gap-3">
                <div 
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  1
                </div>
                <div className="font-body text-sm leading-relaxed" style={{ color: 'var(--color-on-surface)' }}>
                  Toque no botão de <strong>Compartilhar</strong> no menu inferior do Safari.
                  <div className="mt-1 flex items-center justify-center border rounded-lg p-2 bg-neutral-50 border-neutral-100">
                    <Share className="h-5 w-5 text-blue-500" />
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div 
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  2
                </div>
                <div className="font-body text-sm leading-relaxed" style={{ color: 'var(--color-on-surface)' }}>
                  Role a lista para baixo e selecione <strong>Adicionar à Tela de Início</strong>.
                  <div className="mt-1 flex items-center gap-3 border rounded-lg p-2 bg-neutral-50 border-neutral-100 text-xs">
                    <Plus className="h-4 w-4" />
                    <span>Adicionar à Tela de Início</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div 
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  3
                </div>
                <div className="font-body text-sm leading-relaxed" style={{ color: 'var(--color-on-surface)' }}>
                  Toque em <strong>Adicionar</strong> no canto superior direito para confirmar.
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setShowIosInstructions(false)
                setShowPrompt(false)
                localStorage.setItem('pwa-prompt-dismissed', Date.now().toString())
              }}
              className="w-full rounded-xl py-3 text-sm font-bold text-white shadow-sm transition-all hover:brightness-105 active:scale-95 cursor-pointer"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  )
}
