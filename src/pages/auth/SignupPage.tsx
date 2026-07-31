import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, User, Loader2, ArrowRight, Eye, EyeOff, MailCheck } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/app/providers/AuthProvider'
import { useEffect } from 'react'
import { toast } from 'sonner'

export function SignupPage() {
  const navigate = useNavigate()
  const { isAuthenticated, isAdmin } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState('')

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading && !success) {
      if (isAdmin) {
        navigate('/admin', { replace: true })
      } else {
        navigate('/app', { replace: true })
      }
    }
  }, [isAuthenticated, isAdmin, navigate, isLoading, success])

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      if (error) throw error
    } catch (err) {
      toast.error('Erro ao entrar com Google')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('TIMEOUT')), 15000)
      );

      const authPromise = supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      // @ts-ignore
      const { data, error: authError } = await Promise.race([authPromise, timeoutPromise]);

      if (authError) {
        setError(authError.message.includes('already registered') ? 'Este e-mail já está cadastrado.' : authError.message)
        return
      }

      setRegisteredEmail(email)
      setSuccess(true)

      // Don't redirect — user must confirm email first
    } catch (err: any) {
      if (err.message === 'TIMEOUT') {
        setError('Conexão bloqueada pelo navegador. Desative bloqueadores ou antivírus (ex: Kaspersky) ou tente novamente.')
      } else {
        setError('Erro inesperado. Tente novamente.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center py-10 animate-in zoom-in duration-300 space-y-6">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[2rem] bg-emerald-100 text-emerald-600 shadow-xl shadow-emerald-600/10">
          <MailCheck className="h-12 w-12" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-extrabold text-on-surface tracking-tight">Conta criada! 🎉</h2>
          <p className="text-text-secondary leading-relaxed">
            Enviamos um e-mail de confirmação para<br />
            <span className="font-bold text-on-surface">{registeredEmail}</span>
          </p>
          <p className="text-sm text-text-secondary">
            Abra o e-mail e clique no link de confirmação para ativar sua conta.
          </p>
        </div>
        <div className="rounded-xl px-4 py-3 text-xs bg-amber-50 text-amber-700 border border-amber-100 text-left space-y-1">
          <p className="font-bold">Não recebeu o e-mail?</p>
          <p>Verifique sua caixa de spam ou lixo eletrônico. O e-mail pode levar alguns minutos.</p>
        </div>
        <p className="text-center font-medium text-text-secondary">
          Já confirmou? <a href="/auth/login" className="text-primary font-bold hover:underline">Faça login agora</a>
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <h2 className="text-3xl font-extrabold text-on-surface tracking-tight">Criar conta</h2>
        <p className="text-text-secondary">Junte-se a nós para simplificar sua vida na cozinha.</p>
      </div>

      {error && (
        <div className="rounded-xl px-4 py-3 text-xs font-bold bg-red-50 text-red-600 border border-red-100">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="signup-name" className="text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">Nome Completo</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-warm-gray-medium group-focus-within:text-primary transition-colors" />
              <input
                id="signup-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                required
                className="w-full bg-neutral-100 border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-on-surface placeholder:text-warm-gray-medium"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="signup-email" className="text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">E-mail</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-warm-gray-medium group-focus-within:text-primary transition-colors" />
              <input
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="w-full bg-neutral-100 border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-on-surface placeholder:text-warm-gray-medium"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="signup-password" className="text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">Senha</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-warm-gray-medium group-focus-within:text-primary transition-colors" />
              <input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
                className="w-full bg-neutral-100 border-none rounded-2xl py-4 pl-12 pr-12 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-on-surface placeholder:text-warm-gray-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-warm-gray-medium hover:text-primary transition-colors"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/10 hover:bg-primary/95 active:scale-[0.98] transition-all flex justify-center items-center gap-2 disabled:opacity-50 cursor-pointer"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Criar minha conta'}
            {!isLoading && <ArrowRight className="h-5 w-5" />}
          </button>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-surface px-4 text-xs font-bold text-warm-gray-medium uppercase tracking-tighter">Ou cadastre-se com</span>
            </div>
          </div>

          <button 
            type="button"
            onClick={handleGoogleLogin}
            className="w-full py-4 bg-white border border-neutral-200 rounded-2xl font-bold text-on-surface hover:bg-neutral-50 active:scale-[0.98] transition-all flex justify-center items-center gap-3 shadow-sm cursor-pointer"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z" fill="#FBBC05"></path>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
            </svg>
            Google
          </button>
        </div>
      </form>

      <p className="text-center font-medium text-text-secondary pt-4">
        Já tem uma conta? <Link to="/auth/login" className="text-primary font-bold hover:underline">Entre agora</Link>
      </p>
    </div>
  )
}
