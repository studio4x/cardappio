import { Link } from 'react-router-dom'
import { Check, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function PublicPlansPage() {
  const plans = [
    {
      name: 'Gratuito',
      price: 'R$ 0',
      description: 'Perfeito para quem está começando a se organizar.',
      features: [
        'Planejamento de até 3 dias/semana',
        'Acesso a 50 receitas básicas',
        'Lista de compras básica',
        '1 perfil de usuário'
      ],
      cta: 'Começar agora',
      href: '/cadastrar',
      featured: false
    },
    {
      name: 'Pro',
      price: 'R$ 19,90',
      period: '/mês',
      description: 'O planejador completo para sua rotina diária.',
      features: [
        'Planejamento de 7 dias (ilimitado)',
        'Catálogo Premium (+500 receitas)',
        'Lista de compras inteligente e editável',
        'Trocas e Sugestões inteligentes',
        'Histórico ilimitado',
        'Acesso prioritário a novas coleções'
      ],
      cta: 'Assinar Pro',
      href: '/cadastrar?plan=pro',
      featured: true
    }
  ]

  return (
    <div className="min-h-screen bg-slate-50 py-20 px-6">
      <div className="max-w-6xl mx-auto space-y-16">
        <div className="text-center space-y-4">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900" style={{ fontFamily: 'var(--font-heading)' }}>
            O plano ideal para sua <span className="text-emerald-600">cozinha</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Economize tempo e dinheiro com planejamento inteligente. Escolha o plano que melhor se adapta à sua família.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 max-w-4xl mx-auto">
          {plans.map((plan, idx) => (
            <div 
              key={idx} 
              className={`relative flex flex-col p-8 rounded-[2.5rem] border-2 transition-all hover:scale-[1.02] ${
                plan.featured 
                ? 'bg-white border-emerald-500 shadow-2xl shadow-emerald-100' 
                : 'bg-white border-slate-200'
              }`}
            >
              {plan.featured && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full">
                  Mais Popular
                </div>
              )}

              <div className="space-y-4 mb-8">
                <h3 className="text-2xl font-bold text-slate-900">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-900">{plan.price}</span>
                  {plan.period && <span className="text-slate-500 font-medium">{plan.period}</span>}
                </div>
                <p className="text-slate-600 text-sm">{plan.description}</p>
              </div>

              <ul className="space-y-4 mb-10 flex-grow">
                {plan.features.map((feature, fIdx) => (
                  <li key={fIdx} className="flex items-start gap-3 text-sm text-slate-700">
                    <div className="mt-0.5 rounded-full p-0.5 bg-emerald-100 text-emerald-600">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>

              <Button 
                variant={plan.featured ? 'default' : 'outline'} 
                size="lg" 
                className={`rounded-full w-full font-bold h-12 ${
                  plan.featured ? 'bg-emerald-600 hover:bg-emerald-700' : ''
                }`}
                asChild
              >
                <Link to={plan.href}>
                  {plan.cta}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          ))}
        </div>

        <div className="text-center">
          <p className="text-slate-500 text-sm">
            Dúvidas sobre os planos? <Link to="/faq" className="text-emerald-600 font-semibold underline underline-offset-4">Consulte nosso FAQ</Link> ou <Link to="/contato" className="text-emerald-600 font-semibold underline underline-offset-4">entre em contato</Link>.
          </p>
        </div>
      </div>
    </div>
  )
}
