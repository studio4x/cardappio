import { useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Utensils, ArrowRight, Clock, Star, PiggyBank, Sparkles, Check, ChevronRight } from 'lucide-react'
import { config } from '@/config'
import { SEO } from '@/components/shared/SEO'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import type { AdminPlan } from '@/hooks/admin/useAdminPlans'
import { useAuth } from '@/app/providers/AuthProvider'
import { LoadingState } from '@/components/shared/LoadingState'

const hasLocalSession = () => {
  if (typeof window === 'undefined') return false
  try {
    return Object.keys(localStorage).some(key => key.startsWith('sb-') && key.endsWith('-auth-token'))
  } catch {
    return false
  }
}

export function LandingPage() {
  const { isAuthenticated, isAdmin, isLoading: isAuthLoading } = useAuth()
  const navigate = useNavigate()

  const isMobileSession = (() => {
    if (typeof window === 'undefined') return false
    const isMobileViewport = window.innerWidth < 768
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                         (window.navigator as any).standalone === true
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    return isMobileViewport || isStandalone || isMobileUA
  })()

  const hasSessionToken = hasLocalSession()

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated && isMobileSession) {
      if (isAdmin) {
        navigate('/admin', { replace: true })
      } else {
        navigate('/app', { replace: true })
      }
    }
  }, [isAuthLoading, isAuthenticated, isAdmin, isMobileSession, navigate])

  const defaultPlans: AdminPlan[] = [
    {
      id: 'default-pro-14',
      name: 'Plano PRO 14 Dias',
      slug: 'plano-pro-14-dias',
      description: 'Liberdade total e recursos de inteligência de voz. Inclui 15 dias de degustação grátis no cadastro!',
      price_monthly: 24.90,
      price_yearly: 249.00,
      features: [
        '15 dias de degustação PRO GRÁTIS ao se cadastrar',
        'Planejamento de até 14 dias (2 semanas)',
        'Refeições e cardápios ilimitados por dia',
        'Orientação por Voz com Assistente de IA',
        'Catálogo completo de receitas e coleções',
        'Lista de compras automatizada'
      ],
      is_active: true,
      stripe_price_id_monthly: null,
      stripe_price_id_yearly: null
    },
    {
      id: 'default-pro-7',
      name: 'Plano PRO 7 Dias',
      slug: 'plano-pro-7-dias',
      description: 'Para quem quer planejar a semana inteira com praticidade.',
      price_monthly: 14.90,
      price_yearly: 149.00,
      features: [
        'Planejamento de 7 dias por semana',
        '2 refeições por dia (Almoço e Jantar)',
        'Catálogo de Receitas PRO liberado',
        'Lista de compras inteligente automatizada',
        'Suporte prioritário'
      ],
      is_active: true,
      stripe_price_id_monthly: null,
      stripe_price_id_yearly: null
    },
    {
      id: 'default-free',
      name: 'Plano Gratuito',
      slug: 'plano-gratuito',
      description: 'Ativado após o término dos 15 dias de degustação PRO.',
      price_monthly: 0,
      price_yearly: 0,
      features: [
        'Planejamento de 1 dia liberado por semana',
        'Acesso a receitas básicas gratuitas',
        'Lista de compras básica do dia liberado',
        'Acesso contínuo sem custo'
      ],
      is_active: true,
      stripe_price_id_monthly: null,
      stripe_price_id_yearly: null
    }
  ]

  const { data: dbPlans, isLoading } = useQuery({
    queryKey: ['public-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price_monthly', { ascending: true })
      if (error) throw error
      return data as AdminPlan[]
    }
  })

  // Map dbPlans to ensure descriptions, features and prices match current business rules, sorted left-to-right: PRO 14, PRO 7, Free
  const plans = useMemo(() => {
    const rawList = (!dbPlans || dbPlans.length === 0) ? defaultPlans : dbPlans.map(plan => {
      if (plan.slug === 'plano-gratuito' || plan.slug === 'free' || plan.price_monthly === 0) {
        return {
          ...plan,
          name: 'Plano Gratuito',
          description: 'Ativado após o término dos 15 dias de degustação PRO.',
          features: [
            'Planejamento de 1 dia liberado por semana',
            'Acesso a receitas básicas gratuitas',
            'Lista de compras básica do dia liberado',
            'Acesso contínuo sem custo'
          ]
        }
      }
      if (plan.slug === 'plano-pro-7-dias' || plan.slug === 'plano-7-refeicoes') {
        return {
          ...plan,
          name: 'Plano PRO 7 Dias',
          description: 'Para quem quer planejar a semana inteira com praticidade.',
          price_monthly: 14.90,
          features: [
            'Planejamento de 7 dias por semana',
            '2 refeições por dia (Almoço e Jantar)',
            'Catálogo de Receitas PRO liberado',
            'Lista de compras inteligente automatizada',
            'Suporte prioritário'
          ]
        }
      }
      if (plan.slug === 'plano-pro-14-dias' || plan.slug === 'plano-14-refeicoes' || plan.slug === 'pro') {
        return {
          ...plan,
          name: 'Plano PRO 14 Dias',
          description: 'Liberdade total e recursos de inteligência de voz.',
          price_monthly: 24.90,
          features: [
            '15 dias de degustação PRO GRÁTIS ao se cadastrar',
            'Planejamento de até 14 dias (2 semanas)',
            'Refeições e cardápios ilimitados por dia',
            'Orientação por Voz com Assistente de IA',
            'Catálogo completo de receitas e coleções',
            'Lista de compras automatizada'
          ]
        }
      }
      return plan
    })

    const orderMap: Record<string, number> = {
      'plano-pro-14-dias': 1,
      'plano-14-refeicoes': 1,
      'pro': 1,
      'plano-pro-7-dias': 2,
      'plano-7-refeicoes': 2,
      'plano-gratuito': 3,
      'free': 3,
    }

    return [...rawList].sort((a, b) => (orderMap[a.slug] || 99) - (orderMap[b.slug] || 99))
  }, [dbPlans])

  if (isAuthLoading && isMobileSession && hasSessionToken) {
    return <LoadingState fullScreen message="Redirecionando para o painel..." />
  }

  return (
    <div className="bg-background min-h-screen selection:bg-fresh-green selection:text-white">
      <SEO 
        title="Cardappio - Planeje sua semana, simplifique sua rotina" 
        description="Assuma o controle da sua alimentação com um planejador inteligente. Economize tempo no mercado e garanta refeições saudáveis todos os dias."
      />

      {/* Hero Section */}
      <section className="relative pt-40 pb-24 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl">
          <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]"></div>
          <div className="absolute top-40 left-0 w-[400px] h-[400px] bg-tertiary/5 rounded-full blur-[100px]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-fresh-green/10 border border-fresh-green/20 px-4 py-2 rounded-full mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold text-primary uppercase tracking-widest">O mais amado por 2.000+ chefs de casa</span>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-black mb-8 leading-[1.05] tracking-tight text-on-surface animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
              Sua rotina na cozinha, <span className="text-gradient">simplificada.</span>
            </h1>
            
            <p className="text-xl text-text-secondary leading-relaxed mb-12 max-w-2xl animate-in fade-in slide-in-from-bottom-12 duration-700 delay-200">
              Economize tempo, reduza o desperdício e coma melhor. Planeje sua semana em minutos com o Cardappio.
            </p>

            <div className="flex flex-col sm:flex-row gap-5 animate-in fade-in slide-in-from-bottom-16 duration-700 delay-300">
              <Link
                to="/auth/cadastro"
                className="bg-primary text-white px-10 py-5 rounded-2xl font-bold text-lg shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all no-underline text-center inline-flex items-center justify-center gap-2"
              >
                Começar Grátis agora <ArrowRight className="h-5 w-5" />
              </Link>
              <a
                href="#como-funciona"
                className="bg-white border border-border text-on-surface px-10 py-5 rounded-2xl font-bold text-lg hover:bg-neutral-50 active:scale-95 transition-all no-underline text-center"
              >
                Como funciona
              </a>
            </div>
            
            <div className="mt-12 flex items-center gap-6 animate-in fade-in duration-1000 delay-500">
               <div className="flex -space-x-4">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-neutral-200 overflow-hidden">
                       <img src={`https://i.pravatar.cc/100?u=${i}`} alt="User" />
                    </div>
                  ))}
               </div>
               <div className="space-y-1">
                  <div className="flex gap-1 text-amber-400">
                     {[1,2,3,4,5].map(i => <Star key={i} className="h-4 w-4 fill-current" />)}
                  </div>
                  <p className="text-xs font-medium text-text-secondary">Avaliado com 4.9 estrelas na AppStore</p>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured UI Preview */}
      <section className="px-6 pb-32">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-[48px] p-4 shadow-2xl shadow-primary/5 border border-neutral-100 overflow-hidden group">
            <div className="aspect-video relative overflow-hidden rounded-[32px] bg-neutral-50">
              <img 
                src="https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=2071&auto=format&fit=crop" 
                alt="Cardappio UI" 
                className="w-full h-full object-cover grayscale-[0.2] group-hover:scale-105 transition-transform duration-1000"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              
              <div className="absolute bottom-12 left-12 glass p-8 rounded-3xl max-w-sm animate-in fade-in slide-in-from-left-8 duration-1000 delay-700">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary mb-2 block">Destaque</span>
                <h4 className="text-xl font-bold mb-2">Planejador Semanal Visual</h4>
                <p className="text-sm text-text-secondary leading-relaxed">Arraste e solte suas receitas favoritas para montar o cardápio da semana em segundos.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Bento */}
      <section id="beneficios" className="py-32 bg-slate-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black mb-6">Feito para sua vida real.</h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
              Diga adeus ao estresse de decidir o que comer todos os dias no último minuto.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-12 rounded-[40px] border border-neutral-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all group">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <Clock className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Ganhe tempo livre</h3>
              <p className="text-text-secondary leading-relaxed">Planeje sua semana uma única vez e recupere horas preciosas que antes eram gastas na indecisão.</p>
            </div>

            <div className="bg-white p-12 rounded-[40px] border border-neutral-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all group">
              <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <PiggyBank className="h-8 w-8 text-secondary" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Economia inteligente</h3>
              <p className="text-text-secondary leading-relaxed">Com a lista de compras automática, você compra apenas o que realmente precisa e evita o desperdício.</p>
            </div>

            <div className="bg-white p-12 rounded-[40px] border border-neutral-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all group">
              <div className="w-16 h-16 bg-tertiary/10 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <Utensils className="h-8 w-8 text-tertiary" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Alimentação consciente</h3>
              <p className="text-text-secondary leading-relaxed">Crie hábitos saudáveis escolhendo receitas nutritivas com antecedência e evite fast-food por cansaço.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section id="como-funciona" className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="relative">
              <div className="relative rounded-[48px] overflow-hidden shadow-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=2053&auto=format&fit=crop" 
                  alt="Cooking" 
                  className="w-full aspect-[4/5] object-cover"
                />
                <div className="absolute inset-0 bg-primary/20 mix-blend-multiply"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-primary/60 to-transparent"></div>
                <div className="absolute bottom-12 left-12 text-white">
                   <p className="text-4xl font-black mb-2">Simples assim.</p>
                   <p className="text-lg opacity-80">Três passos para a paz na cozinha.</p>
                </div>
              </div>
            </div>

            <div className="space-y-16">
              {[
                { 
                  title: 'Monte seu plano', 
                  desc: 'Escolha suas receitas favoritas para cada dia da semana. Almoço e jantar planejados em poucos cliques.',
                  icon: <ChevronRight className="h-5 w-5" />
                },
                { 
                  title: 'Lista mágica', 
                  desc: 'Nossa IA gera automaticamente uma lista de compras organizada por categorias do supermercado.',
                  icon: <Check className="h-5 w-5" />
                },
                { 
                  title: 'Cozinhe e relaxe', 
                  desc: 'Siga seu plano visual e aproveite refeições deliciosas sem ter que pensar no "que tem pra hoje".',
                  icon: <Sparkles className="h-5 w-5" />
                }
              ].map((step, i) => (
                <div key={i} className="flex gap-8 group">
                  <div className="flex-shrink-0 w-16 h-16 rounded-full border-2 border-primary/20 flex items-center justify-center text-2xl font-black text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500">
                    {i + 1}
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold mb-3">{step.title}</h4>
                    <p className="text-text-secondary leading-relaxed text-lg">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section id="planos" className="py-32 bg-slate-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900">
              O plano ideal para sua <span className="text-gradient">cozinha</span>
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
              Economize tempo e dinheiro com planejamento inteligente. Escolha o plano que melhor se adapta à sua família.
            </p>
          </div>

          {isLoading ? (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
              {[1, 2].map((i) => (
                <div key={i} className="animate-pulse bg-white border border-slate-200 rounded-[2.5rem] p-8 h-[400px] flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="h-6 w-24 bg-slate-200 rounded-full"></div>
                    <div className="h-10 w-32 bg-slate-200 rounded-full"></div>
                    <div className="h-4 w-48 bg-slate-200 rounded-full"></div>
                  </div>
                  <div className="space-y-3">
                    {[1, 2, 3].map(j => (
                      <div key={j} className="h-3 w-full bg-slate-200 rounded-full"></div>
                    ))}
                  </div>
                  <div className="h-12 w-full bg-slate-200 rounded-2xl"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className={`grid gap-8 max-w-5xl mx-auto ${
              plans && plans.length >= 3 ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2'
            }`}>
              {plans?.map((plan: AdminPlan) => {
                const isPro14 = plan.slug === 'plano-pro-14-dias' || plan.slug === 'pro' || plan.slug === 'plano-14-refeicoes'
                const isFree = plan.price_monthly === 0
                const featuresList = Array.isArray(plan.features) ? plan.features : []
                return (
                  <div 
                    key={plan.id}
                    className={`relative flex flex-col p-8 rounded-[2.5rem] border transition-all hover:scale-[1.02] ${
                      isPro14 
                        ? 'border-2 bg-white border-primary shadow-2xl shadow-primary/5' 
                        : 'bg-white border-slate-200 shadow-sm hover:shadow-md'
                    }`}
                  >
                    {isPro14 && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white text-[11px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full whitespace-nowrap shadow-md">
                        15 Dias Grátis no Cadastro
                      </div>
                    )}

                    <div className="space-y-4 mb-8">
                      <h3 className="text-2xl font-bold text-slate-900">{plan.name}</h3>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black text-slate-900">
                          R$ {plan.price_monthly.toLocaleString('pt-BR', { minimumFractionDigits: plan.price_monthly % 1 !== 0 ? 2 : 0, maximumFractionDigits: 2 })}
                        </span>
                        {!isFree && <span className="text-slate-500 font-medium">/mês</span>}
                      </div>
                      {plan.description && <p className="text-slate-600 text-sm">{plan.description}</p>}
                    </div>

                    <ul className="space-y-4 mb-10 flex-grow">
                      {featuresList.map((feature: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-3 text-sm text-slate-700">
                          <div className="mt-0.5 rounded-full p-0.5 bg-emerald-100 text-emerald-600">
                            <Check className="h-3.5 w-3.5" />
                          </div>
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <Link
                      to={
                        isFree 
                          ? (isAuthenticated ? '/app' : '/auth/cadastro') 
                          : (isAuthenticated 
                              ? `/app/assinatura?checkout_immediate=true&plan=${plan.slug}` 
                              : `/auth/cadastro?plan=${plan.slug}`)
                      }
                      className={`px-6 py-4 rounded-2xl text-center font-bold text-sm transition-all no-underline flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 ${
                        isPro14
                          ? 'bg-primary text-white hover:opacity-90 shadow-xl shadow-primary/20'
                          : 'bg-white border border-border text-on-surface hover:bg-neutral-50 shadow-sm'
                      }`}
                    >
                      {isFree ? 'Começar agora' : isPro14 ? 'Experimentar 15 Dias Grátis' : `Assinar ${plan.name}`} <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-on-surface rounded-[64px] p-16 md:p-24 text-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[140px] -mr-40 -mt-40"></div>
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-fresh-green/10 rounded-full blur-[100px] -ml-20 -mb-20"></div>
            
            <div className="relative z-10">
              <h2 className="text-4xl md:text-6xl font-black text-white mb-8 max-w-4xl mx-auto leading-tight">
                Pronto para transformar sua relação com a comida?
              </h2>
              <p className="text-xl text-white/60 mb-12 max-w-2xl mx-auto">
                Milhares de famílias já simplificaram suas rotinas. Junte-se a elas hoje.
              </p>
              
              <Link
                to="/auth/cadastro"
                className="bg-white text-on-surface px-12 py-6 rounded-3xl font-bold text-xl shadow-2xl hover:scale-105 active:scale-95 transition-all no-underline inline-flex items-center gap-3"
              >
                Criar minha conta grátis <ArrowRight className="h-6 w-6" />
              </Link>
              <p className="text-white/40 mt-8 text-sm font-medium uppercase tracking-widest">Não requer cartão de crédito • 100% Grátis</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
