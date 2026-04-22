import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, User, Loader2 } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'

export function SignupPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (authError) {
        if (authError.message.includes('already registered')) {
          setError('Este e-mail já está cadastrado. Tente fazer login.')
        } else {
          setError(authError.message)
        }
        return
      }

      // Profile will be auto-created by the DB trigger (handle_new_user)
      // If email confirmation is disabled, redirect directly
      setSuccess(true)

      // Navigate to app after small delay for auth state to propagate
      setTimeout(() => {
        navigate('/app/onboarding', { replace: true })
      }, 500)
    } catch {
      setError('Erro inesperado. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center py-4">
        <div
          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
          style={{ backgroundColor: 'color-mix(in srgb, var(--color-success) 15%, transparent)' }}
        >
          <span className="text-2xl">✓</span>
        </div>
        <h2
          className="mb-2 text-xl font-bold"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-on-surface)' }}
        >
          Conta criada!
        </h2>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Redirecionando para o onboarding...
        </p>
      </div>
    )
  }

  return (
    <div>
      <h2
        className="mb-1 text-2xl font-bold"
        style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-on-surface)' }}
      >
        Criar conta
      </h2>
      <p className="mb-6 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
        Comece a organizar suas refeições da semana.
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
          <label htmlFor="signup-name" className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--color-on-surface)' }}>
            Nome
          </label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--color-outline)' }} />
            <input
              id="signup-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
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

        <div>
          <label htmlFor="signup-email" className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--color-on-surface)' }}>
            E-mail
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--color-outline)' }} />
            <input
              id="signup-email"
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

        <div>
          <label htmlFor="signup-password" className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--color-on-surface)' }}>
            Senha
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--color-outline)' }} />
            <input
              id="signup-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
              minLength={6}
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
          {isLoading ? 'Criando conta...' : 'Criar conta'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
        Já tem conta?{' '}
        <Link to="/auth/login" className="font-medium" style={{ color: 'var(--color-primary)' }}>
          Entrar
        </Link>
      </p>
    </div>
  )
}
