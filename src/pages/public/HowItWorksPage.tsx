import { Link } from 'react-router-dom'
import { CheckCircle2, ShoppingBag, Utensils, CalendarDays, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function HowItWorksPage() {
  const steps = [
    {
      icon: <CalendarDays className="h-8 w-8 text-white" />,
      title: 'Planeje sua semana',
      description: 'Escolha quais dias da semana você quer cozinhar e defina se quer almoço, jantar ou ambos.'
    },
    {
      icon: <Utensils className="h-8 w-8 text-white" />,
      title: 'Escolha suas receitas',
      description: 'Navegue por centenas de receitas testadas e aprovadas, otimizadas para o seu tempo e orçamento.'
    },
    {
      icon: <ShoppingBag className="h-8 w-8 text-white" />,
      title: 'Gere sua lista de compras',
      description: 'Com um clique, transformamos seu cardápio em uma lista de compras organizada por categoria.'
    }
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="bg-white py-16 px-6 sm:py-24">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900" style={{ fontFamily: 'var(--font-heading)' }}>
            Como o <span className="text-emerald-600">Cardappio</span> simplifica sua vida?
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Nossa missão é eliminar a pergunta "o que vamos comer hoje?" e reduzir o desperdício de alimentos através do planejamento inteligente.
          </p>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto grid gap-12 sm:grid-cols-3">
          {steps.map((step, idx) => (
            <div key={idx} className="relative flex flex-col items-center text-center space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-emerald-600 shadow-xl shadow-emerald-200">
                {step.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900">{step.title}</h3>
              <p className="text-slate-600 leading-relaxed text-sm">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-slate-900 py-20 px-6 text-white">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">Por que planejar?</h2>
            <p className="text-slate-400">Dados reais de nossos usuários mostram que o planejamento semanal traz benefícios imediatos.</p>
          </div>
          
          <div className="grid gap-6 sm:grid-cols-2">
            {[
              'Economia de até 30% nas compras do mês',
              'Redução drástica no desperdício de alimentos',
              'Alimentação mais variada e saudável',
              'Menos estresse no final do dia'
            ].map((benefit, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/10">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <span className="font-medium">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 text-center">
        <div className="max-w-2xl mx-auto space-y-8 p-12 rounded-[3rem] bg-emerald-50 border border-emerald-100">
          <h2 className="text-3xl font-bold text-slate-900">Pronto para começar?</h2>
          <p className="text-slate-600">Junte-se a milhares de pessoas que já economizam tempo e dinheiro com o Cardappio.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="rounded-full px-8 bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto" asChild>
              <Link to="/cadastrar">Criar conta grátis</Link>
            </Button>
            <Button variant="ghost" size="lg" className="rounded-full px-8 w-full sm:w-auto group" asChild>
              <Link to="/planos">
                Ver planos pro
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
