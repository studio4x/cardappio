import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Loader2 } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        if (authError.message === 'Invalid login credentials') {
          setError('E-mail ou senha inválidos.')
        } else {
          setError(authError.message)
        }
        return
      }

      // Auth state change will be handled by AuthProvider
      navigate('/app', { replace: true })
    } catch {
      setError('Erro inesperado. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <h2
        className="mb-1 text-2xl font-bold"
        style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-on-surface)' }}
      >
        Entrar
      </h2>
      <p className="mb-6 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
        Acesse sua conta para planejar a semana.
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
        {/* Email */}
        <div>
          <label htmlFor="login-email" className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--color-on-surface)' }}>
            E-mail
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--color-outline)' }} />
            <input
              id="login-email"
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

        {/* Password */}
        <div>
          <label htmlFor="login-password" className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--color-on-surface)' }}>
            Senha
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--color-outline)' }} />
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
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

        {/* Forgot */}
        <div className="text-right">
          <Link to="/auth/recuperar" className="text-xs font-medium" style={{ color: 'var(--color-primary)' }}>
            Esqueceu a senha?
          </Link>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 cursor-pointer"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isLoading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
        Não tem conta?{' '}
        <Link to="/auth/cadastro" className="font-medium" style={{ color: 'var(--color-primary)' }}>
          Crie uma grátis
        </Link>
      </p>
    </div>
  )
}
