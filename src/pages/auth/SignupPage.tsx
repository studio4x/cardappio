import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, User, Loader2, ArrowRight } from 'lucide-react'
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
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('TIMEOUT')), 6000)
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

      setSuccess(true)

      let targetRoute = '/app/onboarding'
      if (data?.user) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single()

          if (profile?.role === 'admin' || profile?.role === 'super_admin') {
            targetRoute = '/admin'
          }
        } catch (e) {
          console.error("Failed to query role after signup", e)
        }
      }

      setTimeout(() => {
        navigate(targetRoute, { replace: true })
      }, 500)
    } catch (err: any) {
      if (err.message === 'TIMEOUT') {
        setError('Conexão bloqueada pelo navegador. Desative bloqueadores ou antivírus (ex: Kaspersky).')
      } else {
        setError('Erro inesperado. Tente novamente.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center py-10 animate-in zoom-in duration-300">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-emerald-100 text-emerald-600 shadow-xl shadow-emerald-600/10">
          <ArrowRight className="h-10 w-10 rotate-[-45deg]" />
        </div>
        <h2 className="text-3xl font-extrabold text-on-surface tracking-tight mb-3">Bem-vindo!</h2>
        <p className="text-text-secondary">Sua conta foi criada com sucesso. Redirecionando...</p>
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
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
                className="w-full bg-neutral-100 border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-on-surface placeholder:text-warm-gray-medium"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/10 hover:bg-primary/95 active:scale-[0.98] transition-all flex justify-center items-center gap-2 disabled:opacity-50"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Criar minha conta'}
          {!isLoading && <ArrowRight className="h-5 w-5" />}
        </button>
      </form>

      <p className="text-center font-medium text-text-secondary pt-4">
        Já tem uma conta? <Link to="/auth/login" className="text-primary font-bold hover:underline">Entre agora</Link>
      </p>
    </div>
  )
}
