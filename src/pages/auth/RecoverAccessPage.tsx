import { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { Mail, Loader2, ArrowLeft, Eye, EyeOff, Key } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { translateAuthError } from '@/lib/auth-errors'

export function RecoverAccessPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const isReset = searchParams.get('reset') === 'true'

  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  // Password Reset State
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null)

  useEffect(() => {
    if (isReset) {
      setIsLoading(true)
      supabase.auth.getUser()
        .then(({ data: { user } }) => {
          if (user?.email) {
            setCurrentUserEmail(user.email)
          } else {
            setError('Sessão de recuperação inválida ou expirada. Por favor, solicite um novo link.')
          }
        })
        .catch(() => {
          setError('Erro ao validar os dados da sessão de recuperação.')
        })
        .finally(() => {
          setIsLoading(false)
        })
    }
  }, [isReset])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback`,
      })

      if (resetError) {
        setError(translateAuthError(resetError.message))
        return
      }

      setSent(true)
    } catch {
      setError('Erro inesperado. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }
    if (newPassword.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // 1. Capture current updated_at to verify the change actually occurred
      const { data: { user: beforeUser } } = await supabase.auth.getUser()
      if (!beforeUser) {
        setError('Sessão de recuperação expirada. Por favor, solicite um novo link.')
        return
      }
      const beforeUpdatedAt = beforeUser.updated_at

      // 2. Update the password
      const { data: updateData, error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (updateError) {
        setError(translateAuthError(updateError.message))
        return
      }

      // 3. Verify the update actually persisted: updated_at must have changed
      const afterUpdatedAt = updateData.user?.updated_at
      if (!afterUpdatedAt || afterUpdatedAt === beforeUpdatedAt) {
        setError(
          'Não foi possível confirmar a alteração da senha. Sua conexão pode estar bloqueando a requisição (ex: antivírus Kaspersky). ' +
          'Tente desativar temporariamente o antivírus e repetir o processo.'
        )
        return
      }

      // 4. Sign out globally (revokes ALL sessions on the server side)
      await supabase.auth.signOut({ scope: 'global' })

      // 5. Force-clear any remaining session from localStorage as a fallback
      // (prevents stale recovery session from auto-redirecting the login page)
      try {
        const keysToRemove = Object.keys(localStorage).filter(
          (k) => k.startsWith('sb-') && k.endsWith('-auth-token')
        )
        keysToRemove.forEach((k) => localStorage.removeItem(k))
        sessionStorage.removeItem('isRecoveryFlow')
      } catch {
        // Ignore storage errors (sandboxed environments)
      }

      toast.success('Senha redefinida com sucesso! Por favor, faça login com a nova senha.', {
        duration: 8000
      })
      navigate(`/auth/login?email=${encodeURIComponent(currentUserEmail || '')}&reset=done`, { replace: true })
    } catch {
      setError('Erro inesperado ao atualizar a senha. Verifique sua conexão e tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isReset) {
    const hasCriticalError = error && !currentUserEmail;

    return (
      <div>
        <h2
          className="mb-1 text-2xl font-bold"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-on-surface)' }}
        >
          Redefinir sua senha
        </h2>
        <p className="mb-6 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          {currentUserEmail ? (
            <>
              Defina uma nova senha para a conta: <strong style={{ color: 'var(--color-on-surface)' }}>{currentUserEmail}</strong>
            </>
          ) : (
            'Crie uma nova senha de acesso para sua conta.'
          )}
        </p>

        {error && (
          <div
            className="mb-4 rounded-lg px-4 py-3 text-sm font-semibold"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color-error) 10%, transparent)',
              color: 'var(--color-error)',
            }}
          >
            {error}
          </div>
        )}

        {!hasCriticalError && (
          <form onSubmit={handleResetSubmit} className="space-y-4">
            <div>
              <label htmlFor="new-password" className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--color-on-surface)' }}>
                Nova Senha
              </label>
              <div className="relative">
                <Key className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--color-outline)' }} />
                <input
                  id="new-password"
                  name="new-password"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  autoComplete="new-password"
                  className="w-full rounded-lg border py-2.5 pl-10 pr-10 text-sm outline-none transition-colors"
                  style={{
                    borderColor: 'var(--color-outline-variant)',
                    backgroundColor: 'var(--color-surface-container-low)',
                    color: 'var(--color-on-surface)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirm-password" className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--color-on-surface)' }}>
                Confirmar Nova Senha
              </label>
              <div className="relative">
                <Key className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--color-outline)' }} />
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirme a nova senha"
                  required
                  autoComplete="new-password"
                  className="w-full rounded-lg border py-2.5 pl-10 pr-10 text-sm outline-none transition-colors"
                  style={{
                    borderColor: 'var(--color-outline-variant)',
                    backgroundColor: 'var(--color-surface-container-low)',
                    color: 'var(--color-on-surface)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 cursor-pointer"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isLoading ? 'Redefinindo...' : 'Salvar nova senha'}
            </button>
          </form>
        )}

        {hasCriticalError && (
          <div className="mt-6 text-center">
            <Link
              to="/auth/recuperar"
              className="inline-flex items-center gap-2 text-sm font-medium"
              style={{ color: 'var(--color-primary)' }}
            >
              <ArrowLeft className="h-4 w-4" />
              Solicitar novo link de recuperação
            </Link>
          </div>
        )}
      </div>
    )
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
