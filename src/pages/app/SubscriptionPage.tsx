import { useState, useEffect } from 'react'
import { useSubscription } from '@/hooks/subscription/useSubscription'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingState } from '@/components/shared/LoadingState'
import { Check, Crown, CreditCard, ArrowRight, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/app/providers/AuthProvider'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { isUserPro, getTrialInfo } from '@/lib/subscription'

export function SubscriptionPage() {
  const { user: profile } = useAuth()
  const { subscription, isLoading, checkoutMutation } = useSubscription()
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly')

  const { data: plans } = useQuery({
    queryKey: ['public-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price_monthly', { ascending: true })
      if (error) throw error
      return data
    }
  })

  const queryParams = new URLSearchParams(window.location.search)
  const checkoutImmediate = queryParams.get('checkout_immediate') === 'true'
  const planSlug = queryParams.get('plan')

  useEffect(() => {
    if (checkoutImmediate && plans && plans.length > 0) {
      const targetPlan = planSlug ? plans.find(p => p.slug === planSlug) : plans.find(p => p.price_monthly > 0)
      if (targetPlan) {
        checkoutMutation.mutate({
          planId: targetPlan.id,
          interval: 'monthly'
        })
      }
    }
  }, [checkoutImmediate, planSlug, plans])

  if (isLoading || !plans) return <LoadingState message="Verificando assinatura e planos..." />

  const isPro = isUserPro(profile)
  const trialInfo = getTrialInfo(profile)

  const planPro7 = plans?.find(p => p.slug === 'plano-pro-7-dias')
  const planPro14 = plans?.find(p => p.slug === 'plano-pro-14-dias')

  const handleUpgrade = (planId: string, interval: 'monthly' | 'yearly') => {
    checkoutMutation.mutate({ 
      planId,
      interval
    })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  const getPlanDisplayName = (tier: string | undefined | null) => {
    if (!tier) return 'Plano Gratuito'
    if (tier === 'plano-pro-7-dias') return 'PRO 7 Dias'
    if (tier === 'plano-pro-14-dias') return trialInfo.isTrial ? 'PRO 14 Dias (Degustação 15 Dias)' : 'PRO 14 Dias'
    if (tier === 'free' || tier === 'plano-gratuito') return 'Plano Gratuito (1 dia/semana)'
    return 'Plano Pro'
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
                {getPlanDisplayName(profile?.subscription_tier)}
              </h3>
              {trialInfo.isTrial && !trialInfo.isExpired && (
                <p className="text-sm font-semibold text-emerald-600 mt-1">
                  Degustação de 15 dias ativa • {trialInfo.daysRemaining} dia(s) restante(s) (até {trialInfo.expirationDate?.toLocaleDateString('pt-BR')})
                </p>
              )}
              {!isPro && (
                <p className="text-sm text-amber-700 mt-1 font-medium">
                  Seu teste expirou. Você está no Plano Gratuito (1 dia liberado por semana).
                </p>
              )}
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {isPro ? (
              <Button 
                variant="outline" 
                className="rounded-full px-8 font-bold border-slate-200"
                onClick={() => toast.info('Acesse o portal da Stripe com seu e-mail de cadastro para gerenciar ou cancelar sua assinatura.')}
              >
                Gerenciar no Portal
              </Button>
            ) : (
              <Button 
                onClick={() => document.getElementById('pricing-plans')?.scrollIntoView({ behavior: 'smooth' })}
                className="rounded-full px-8 font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-200"
              >
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
        <div className="space-y-12">
          {/* Pro Benefits Section */}
          <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white space-y-8 shadow-xl">
             <div className="space-y-2 text-center max-w-2xl mx-auto">
               <h3 className="text-3xl font-black tracking-tight flex items-center justify-center gap-2">
                 <Crown className="h-6 w-6 text-amber-400" />
                 Por que ser Pro?
               </h3>
               <p className="text-slate-400 text-sm">
                 Desbloqueie recursos avançados para planejar suas refeições e organizar sua rotina sem estresse.
               </p>
             </div>
             
             <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto pt-4 border-t border-white/10">
               {[
                 { title: 'Planejamento Semanal Completo', desc: 'Monitore suas refeições de segunda a domingo.' },
                 { title: 'Catálogo de Receitas Premium', desc: 'Acesso a centenas de receitas exclusivas.' },
                 { title: 'Lista de Compras Inteligente', desc: 'Gerada automaticamente com base nas receitas do cardápio.' },
                 { title: 'Filtros Avançados e Preferências', desc: 'Opções ajustadas de acordo com sua dieta ou ingredientes.' },
                 { title: 'Orientação por Voz (IA Cozinheira)', desc: 'Cozinhe acompanhando as instruções por áudio.' },
                 { title: 'Suporte Prioritário', desc: 'Atendimento rápido e exclusivo para tirar dúvidas.' }
               ].map((item, idx) => (
                 <div key={idx} className="flex gap-3 items-start" id={`benefit-${idx}`}>
                   <div className="h-6 w-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                     <Check className="h-3.5 w-3.5 stroke-[3]" />
                   </div>
                   <div>
                     <h4 className="font-bold text-slate-100 text-sm leading-tight">{item.title}</h4>
                     <p className="text-slate-400 text-xs mt-1 leading-snug">{item.desc}</p>
                   </div>
                 </div>
               ))}
             </div>
             
             <div className="pt-4 flex items-center justify-center gap-4 border-t border-white/5">
               <div className="h-10 w-10 flex items-center justify-center rounded-full bg-white/10 shrink-0">
                 <CreditCard className="h-5 w-5 text-emerald-400" />
               </div>
               <p className="text-xs text-slate-400">Pagamento seguro via Stripe. Cancele ou altere de plano a qualquer momento.</p>
             </div>
          </div>

          {/* Pricing Selector & Cards */}
          <div id="pricing-plans" className="flex flex-col items-center gap-10 pt-4">
            <div className="text-center space-y-2">
              <h3 className="text-3xl font-black text-slate-900">Escolha o seu Plano PRO</h3>
              <p className="text-slate-500 text-sm">Opções flexíveis para caber na sua rotina e bolso.</p>
            </div>

            {/* Toggle Switcher */}
            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-full border border-slate-200 shadow-inner">
              <button
                onClick={() => setBillingInterval('monthly')}
                className={cn(
                  "rounded-full px-6 py-2.5 text-xs font-black uppercase tracking-wider transition-all",
                  billingInterval === 'monthly'
                    ? "bg-slate-900 text-white shadow animate-fade-in"
                    : "text-slate-500 hover:text-slate-900"
                )}
              >
                Faturamento Mensal
              </button>
              <button
                onClick={() => setBillingInterval('yearly')}
                className={cn(
                  "rounded-full px-6 py-2.5 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2",
                  billingInterval === 'yearly'
                    ? "bg-slate-900 text-white shadow animate-fade-in"
                    : "text-slate-500 hover:text-slate-900"
                )}
              >
                Faturamento Anual
                <span className="bg-emerald-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-sm">
                  -16% OFF
                </span>
              </button>
            </div>

            {/* Plans Grid */}
            <div className="grid gap-8 w-full md:grid-cols-2 max-w-5xl">
              {/* Plano 7 Dias Card */}
              {planPro7 && (
                <div className="bg-white border-2 border-slate-200 hover:border-slate-300 rounded-[2.5rem] p-8 shadow-sm transition-all flex flex-col justify-between relative overflow-hidden group">
                  <div className="space-y-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-2xl font-black text-slate-900">{planPro7.name}</h4>
                        <p className="text-slate-500 text-sm mt-1">Ideal para o essencial</p>
                      </div>
                      <span className="bg-slate-100 text-slate-700 text-[10px] font-black uppercase px-3 py-1 rounded-full">
                        7 Refeições
                      </span>
                    </div>

                    <div className="flex items-baseline gap-1 py-4 border-y border-slate-100">
                      {billingInterval === 'yearly' ? (
                        <>
                          <span className="text-4xl font-black text-slate-900">
                            {formatPrice(planPro7.price_yearly / 12)}
                          </span>
                          <span className="text-slate-400 font-bold text-sm">/mês</span>
                          <span className="text-xs text-slate-400 block ml-2">
                            (faturado {formatPrice(planPro7.price_yearly)}/ano)
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-4xl font-black text-slate-900">
                            {formatPrice(planPro7.price_monthly)}
                          </span>
                          <span className="text-slate-400 font-bold text-sm">/mês</span>
                        </>
                      )}
                    </div>

                    <ul className="space-y-4">
                      {planPro7.features && Array.isArray(planPro7.features) && planPro7.features.map((feature: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-3 text-sm text-slate-600 font-medium">
                          <Check className="h-5 w-5 text-emerald-500 shrink-0 stroke-[3]" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-8">
                    <Button 
                      onClick={() => handleUpgrade(planPro7.id, billingInterval)}
                      disabled={checkoutMutation.isPending}
                      className="w-full rounded-2xl py-6 font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all flex items-center justify-center gap-2 group-hover:gap-3"
                    >
                      Assinar PRO 7 Dias
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Plano 14 Dias Card */}
              {planPro14 && (
                <div className="bg-emerald-50/50 border-2 border-emerald-500 hover:border-emerald-600 rounded-[2.5rem] p-8 shadow-md transition-all flex flex-col justify-between relative overflow-hidden group">
                  {/* Popular Badge */}
                  <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[9px] font-black uppercase px-4 py-1.5 rounded-bl-2xl tracking-wider shadow">
                    Mais Popular
                  </div>

                  <div className="space-y-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-2xl font-black text-emerald-950">{planPro14.name}</h4>
                        <p className="text-emerald-700/80 text-sm mt-1">Variedade e flexibilidade máxima</p>
                      </div>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase px-3 py-1 rounded-full">
                        14 Refeições
                      </span>
                    </div>

                    <div className="flex items-baseline gap-1 py-4 border-y border-emerald-100">
                      {billingInterval === 'yearly' ? (
                        <>
                          <span className="text-4xl font-black text-emerald-950">
                            {formatPrice(planPro14.price_yearly / 12)}
                          </span>
                          <span className="text-emerald-700/60 font-bold text-sm">/mês</span>
                          <span className="text-xs text-emerald-600 block ml-2">
                            (faturado {formatPrice(planPro14.price_yearly)}/ano)
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-4xl font-black text-emerald-950">
                            {formatPrice(planPro14.price_monthly)}
                          </span>
                          <span className="text-emerald-700/60 font-bold text-sm">/mês</span>
                        </>
                      )}
                    </div>

                    <ul className="space-y-4">
                      {planPro14.features && Array.isArray(planPro14.features) && planPro14.features.map((feature: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-3 text-sm text-emerald-900/80 font-medium">
                          <Check className="h-5 w-5 text-emerald-600 shrink-0 stroke-[3]" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-8">
                    <Button 
                      onClick={() => handleUpgrade(planPro14.id, billingInterval)}
                      disabled={checkoutMutation.isPending}
                      className="w-full rounded-2xl py-6 font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 group-hover:gap-3 shadow-lg shadow-emerald-600/20"
                    >
                      Assinar PRO 14 Dias
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Decorative Sparkle */}
                  <div className="absolute -bottom-6 -right-6 opacity-[0.03] text-emerald-900 pointer-events-none">
                    <Zap className="h-32 w-32 rotate-12" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
