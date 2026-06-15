import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'
import { Button } from '@/components/ui/button'
import { Check, Crown, Sparkles, ArrowRight, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

export function SubscriptionSuccessPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user: profile, refreshProfile } = useAuth()
  const [attempts, setAttempts] = useState(0)
  const [isActivating, setIsActivating] = useState(true)
  const sessionId = searchParams.get('session_id')

  const isPremium = profile?.subscription_tier && 
                    profile.subscription_tier !== 'free' && 
                    profile.subscription_tier !== 'plano-gratuito'

  // Polling to refresh profile and wait for the webhook to update the tier to premium
  useEffect(() => {
    if (isPremium) {
      setIsActivating(false)
      return
    }

    if (attempts >= 10) {
      setIsActivating(false)
      toast.info('O pagamento foi processado, mas a ativação da conta está demorando um pouco. Seus recursos serão liberados em instantes!')
      return
    }

    const interval = setInterval(async () => {
      setAttempts(prev => prev + 1)
      await refreshProfile()
    }, 2500) // Poll every 2.5 seconds

    return () => clearInterval(interval)
  }, [isPremium, attempts, refreshProfile])

  const benefits = [
    { title: 'Planejamento Semanal Avançado', desc: 'Crie cronogramas completos de alimentação e organize os dias sem limites.' },
    { title: 'Catálogo de Receitas Premium', desc: 'Acesso total a centenas de receitas exclusivas, saudáveis e sazonais.' },
    { title: 'Lista de Compras Inteligente', desc: 'Gere a lista automaticamente com base nas receitas do seu planejador.' },
    { title: 'Modo Cozinhar por Voz (IA)', desc: 'Siga receitas passo a passo com o player guiado por áudio e voz.' },
    { title: 'Múltiplos Perfis Familiares', desc: 'Gerencie a alimentação de toda a sua casa em um único local.' }
  ]

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 max-w-xl mx-auto">
      <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 md:p-10 shadow-xl w-full text-center space-y-8 relative overflow-hidden">
        
        {/* Decorative elements */}
        <div className="absolute -top-10 -right-10 opacity-5 pointer-events-none">
          <Crown className="h-40 w-40 rotate-12 text-amber-500" />
        </div>

        {/* Success / Loading Header Icon */}
        <div className="flex justify-center">
          {isActivating ? (
            <div className="h-20 w-20 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center relative animate-pulse">
              <Loader2 className="h-10 w-10 animate-spin" />
              <Crown className="h-5 w-5 absolute -top-1 -right-1 rotate-12 text-amber-500" />
            </div>
          ) : isPremium ? (
            <div className="h-24 w-24 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center relative animate-bounce shadow-lg shadow-emerald-100">
              <Sparkles className="h-10 w-10 animate-pulse" />
              <Crown className="h-6 w-6 absolute -top-1.5 -right-1.5 rotate-12 text-amber-500" />
            </div>
          ) : (
            <div className="h-20 w-20 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center relative">
              <AlertCircle className="h-10 w-10" />
            </div>
          )}
        </div>

        {/* Text Details */}
        <div className="space-y-3">
          {isActivating ? (
            <>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Processando seu pagamento...</h2>
              <p className="text-slate-500 text-sm leading-relaxed max-w-sm mx-auto">
                Aguardando a confirmação da Stripe para liberar seus recursos Premium. Isso leva apenas alguns segundos.
              </p>
            </>
          ) : isPremium ? (
            <>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Sua Assinatura Premium está Ativa! 🎉</h2>
              <p className="text-emerald-600 font-bold text-sm">Parabéns! Você agora é um membro PRO no Cardappio.</p>
              <p className="text-slate-500 text-xs mt-1 leading-relaxed max-w-sm mx-auto">
                Sua transação foi concluída com sucesso. O acesso a todas as ferramentas premium já está liberado na sua conta.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Pagamento Confirmado!</h2>
              <p className="text-slate-500 text-sm leading-relaxed max-w-sm mx-auto">
                Seu pagamento foi aprovado pelo Stripe, mas a sincronização do acesso ainda está em andamento no banco de dados.
              </p>
              <p className="text-[10px] text-muted-foreground italic leading-relaxed max-w-xs mx-auto">
                *Nota: Se o acesso não carregar em instantes, certifique-se de que os webhooks do Stripe foram configurados no painel administrativo.
              </p>
            </>
          )}
        </div>

        {/* Benefits Section */}
        <div className="bg-slate-50 rounded-3xl p-6 text-left border border-slate-100 space-y-4">
          <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
            <Crown className="h-4 w-4 text-amber-500" /> Recursos Premium Liberados
          </h4>
          
          <div className="space-y-4">
            {benefits.map((benefit, idx) => (
              <div key={idx} className="flex gap-3 items-start">
                <div className="h-5 w-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="h-3 w-3 stroke-[3]" />
                </div>
                <div>
                  <h5 className="font-bold text-slate-900 text-sm leading-tight">{benefit.title}</h5>
                  <p className="text-slate-500 text-xs mt-0.5 leading-snug">{benefit.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Button */}
        <div>
          <Button
            onClick={() => navigate('/app')}
            className="w-full rounded-2xl py-6 font-bold bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center gap-2 group cursor-pointer shadow-lg"
          >
            Acessar a Plataforma
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>

      </div>
    </div>
  )
}
