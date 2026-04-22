import { useSubscription } from '@/hooks/subscription/useSubscription'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingState } from '@/components/shared/LoadingState'
import { Check, Crown, CreditCard, ArrowRight, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/app/providers/AuthProvider'

export function SubscriptionPage() {
  const { profile } = useAuth()
  const { subscription, isLoading, checkoutMutation } = useSubscription()

  if (isLoading) return <LoadingState message="Verificando assinatura..." />

  const isPro = profile?.subscription_tier === 'pro'

  const handleUpgrade = (interval: 'month' | 'year') => {
    // For now using a placeholder plan ID from the migration 005
    checkoutMutation.mutate({ 
      planId: 'plan_pro_standard', // Match with seed data if exists
      interval 
    })
  }

  return (
    <div className="space-y-10">
      <PageHeader 
        title="Sua Assinatura" 
        subtitle="Gerencie seu plano e recursos Pro para uma experiência completa."
      />

      {/* Current Plan Status */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm overflow-hidden relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
          <div className="flex items-center gap-6">
            <div className={`h-16 w-16 flex items-center justify-center rounded-2xl ${isPro ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
              {isPro ? <Crown className="h-8 w-8" /> : <Zap className="h-8 w-8" />}
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Plano Atual</p>
              <h3 className="text-3xl font-black text-slate-900">
                {isPro ? 'Cardappio Pro' : 'Plano Gratuito'}
              </h3>
              {isPro && subscription?.subscription_until && (
                <p className="text-sm text-slate-500 mt-1">
                  Válido até {new Date(subscription.subscription_until).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {isPro ? (
              <Button variant="outline" className="rounded-full px-8 font-bold border-slate-200">
                Gerenciar no Portal
              </Button>
            ) : (
              <Button className="rounded-full px-8 font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-200">
                Fazer Upgrade Agora
              </Button>
            )}
          </div>
        </div>
        
        {/* Decorative element */}
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <Crown className="h-32 w-32 rotate-12" />
        </div>
      </div>

      {!isPro && (
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Pro Benefits */}
          <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white space-y-8">
             <div className="space-y-2">
               <h3 className="text-2xl font-bold">Por que ser Pro?</h3>
               <p className="text-slate-400">Desbloqueie o potencial máximo da sua organização alimentar.</p>
             </div>
             
             <ul className="grid gap-4 sm:grid-cols-2">
               {[
                 'Planejamento de 7 dias',
                 '+500 receitas premium',
                 'Listas ilimitadas',
                 'Compartilhamento Pro',
                 'Filtros inteligentes',
                 'Suporte prioritário'
               ].map((item, i) => (
                 <li key={i} className="flex items-center gap-3 text-sm font-medium">
                   <div className="h-5 w-5 flex items-center justify-center rounded-full bg-emerald-500 text-white">
                     <Check className="h-3 w-3 stroke-[4]" />
                   </div>
                   {item}
                 </li>
               ))}
             </ul>
             
             <div className="pt-4 border-t border-white/10 flex items-center gap-4">
               <div className="h-10 w-10 flex items-center justify-center rounded-full bg-white/10">
                 <CreditCard className="h-5 w-5 text-emerald-400" />
               </div>
               <p className="text-xs text-slate-500">Pagamento seguro via Stripe. Cancele quando quiser.</p>
             </div>
          </div>

          {/* Pricing Selector */}
          <div className="flex flex-col gap-4">
             <button 
               onClick={() => handleUpgrade('month')}
               disabled={checkoutMutation.isPending}
               className="group p-8 bg-white border-2 border-slate-200 rounded-[2.5rem] text-left hover:border-emerald-500 transition-all flex items-center justify-between"
             >
               <div>
                 <h4 className="font-bold text-slate-900 text-xl">Mensal</h4>
                 <p className="text-slate-500 text-sm">Flexibilidade total mês a mês</p>
                 <div className="mt-4 flex items-baseline gap-1">
                   <span className="text-3xl font-black text-slate-900">R$ 19,90</span>
                   <span className="text-slate-400 font-medium">/mês</span>
                 </div>
               </div>
               <div className="h-12 w-12 flex items-center justify-center rounded-full bg-slate-50 text-slate-300 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-all">
                 <ArrowRight className="h-6 w-6" />
               </div>
             </button>

             <button 
                onClick={() => handleUpgrade('year')}
                disabled={checkoutMutation.isPending}
                className="group p-8 bg-emerald-50 border-2 border-emerald-500 rounded-[3rem] text-left hover:scale-[1.02] transition-all flex items-center justify-between relative overflow-hidden"
             >
               <div className="relative z-10">
                 <div className="flex items-center gap-2 mb-2">
                   <h4 className="font-bold text-emerald-900 text-xl">Anual</h4>
                   <span className="bg-emerald-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full">Melhor Preço</span>
                 </div>
                 <p className="text-emerald-700/70 text-sm">Acesso por 1 ano com desconto</p>
                 <div className="mt-4 flex items-baseline gap-1">
                   <span className="text-3xl font-black text-emerald-900">R$ 169,90</span>
                   <span className="text-emerald-700/60 font-medium">/ano</span>
                 </div>
               </div>
               <div className="h-14 w-14 flex items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg relative z-10">
                 <ArrowRight className="h-7 w-7" />
               </div>
               {/* Pattern */}
               <div className="absolute -bottom-6 -right-6 opacity-5 transform rotate-12">
                 <Zap className="h-32 w-32" />
               </div>
             </button>
          </div>
        </div>
      )}
    </div>
  )
}
