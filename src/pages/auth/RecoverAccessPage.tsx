import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Loader2, ArrowLeft } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'

export function RecoverAccessPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback`,
      })

      if (resetError) {
        setError(resetError.message)
        return
      }

      setSent(true)
    } catch {
      setError('Erro inesperado. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="text-center py-4">
        <div
          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
          style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 15%, transparent)' }}
        >
          <Mail className="h-7 w-7" style={{ color: 'var(--color-primary)' }} />
        </div>
        <h2
          className="mb-2 text-xl font-bold"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-on-surface)' }}
        >
          E-mail enviado
        </h2>
        <p className="mb-6 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          Se houver uma conta com <strong>{email}</strong>, você receberá um link para redefinir sua senha.
        </p>
        <Link
          to="/auth/login"
          className="inline-flex items-center gap-2 text-sm font-medium"
          style={{ color: 'var(--color-primary)' }}
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao login
        </Link>
      </div>
    )
  }

  return (
    <div>
      <h2
        className="mb-1 text-2xl font-bold"
        style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-on-surface)' }}
      >
        Recuperar acesso
      </h2>
      <p className="mb-6 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
        Informe seu e-mail para receber um link de recuperação.
      </p>

      {error && (
        <div
          className="mb-4 rounded-lg px-4 py-3 text-sm"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-error) 10%, transparent)',
            color: 'var(--color-error)',
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="recover-email" className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--color-on-surface)' }}>
            E-mail
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--color-outline)' }} />
            <input
              id="recover-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              className="w-full rounded-lg border py-2.5 pl-10 pr-4 text-sm outline-none transition-colors"
              style={{
                borderColor: 'var(--color-outline-variant)',
                backgroundColor: 'var(--color-surface-container-low)',
                color: 'var(--color-on-surface)',
              }}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 cursor-pointer"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isLoading ? 'Enviando...' : 'Enviar link de recuperação'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
        <Link to="/auth/login" className="inline-flex items-center gap-1 font-medium" style={{ color: 'var(--color-primary)' }}>
          <ArrowLeft className="h-3 w-3" />
          Voltar ao login
        </Link>
      </p>
    </div>
  )
}
