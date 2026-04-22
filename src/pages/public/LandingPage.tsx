import { Link } from 'react-router-dom'
import { ChefHat, CalendarDays, ShoppingCart, ListChecks, ArrowRight, Utensils, Clock } from 'lucide-react'
import { config } from '@/config'

import { SEO } from '@/components/shared/SEO'

export function LandingPage() {
  return (
    <div>
      <SEO 
        title="Planeje seu cardápio semanal com facilidade" 
        description="Simplifique sua vida na cozinha. O Cardappio organiza suas refeições semanais e gera sua lista de compras automaticamente."
      />
      {/* Hero */}
      <section
        className="py-16 sm:py-24"
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        <div className="container-app text-center">
          <div
            className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium"
            style={{
              borderColor: 'var(--color-outline-variant)',
              color: 'var(--color-primary)',
              backgroundColor: 'var(--color-surface-container-low)',
            }}
          >
            <Utensils className="h-4 w-4" />
            Planeje sua semana em minutos
          </div>
          <h1
            className="mx-auto max-w-3xl text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-on-surface)' }}
          >
            Seu cardápio semanal{' '}
            <span style={{ color: 'var(--color-primary)' }}>pronto em poucos minutos</span>
          </h1>
          <p
            className="mx-auto mt-5 max-w-xl text-lg leading-relaxed"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Monte almoço e jantar da semana, selecione receitas práticas e gere sua lista de compras automaticamente. Menos estresse, mais organização.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              to="/auth/cadastro"
              className="inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-base font-semibold text-white transition-all hover:opacity-90 no-underline"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              Começar agora — é grátis
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/como-funciona"
              className="inline-flex items-center gap-2 rounded-xl border px-7 py-3.5 text-base font-semibold transition-all hover:opacity-80 no-underline"
              style={{
                borderColor: 'var(--color-outline-variant)',
                color: 'var(--color-on-surface)',
              }}
            >
              Como funciona
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        className="py-16"
        style={{ backgroundColor: 'var(--color-surface-container-low)' }}
      >
        <div className="container-app">
          <h2
            className="mb-10 text-center text-3xl font-bold"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Como funciona
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                step: '1',
                icon: CalendarDays,
                title: 'Escolha os dias',
                desc: 'Selecione quais dias da semana você quer planejar.',
              },
              {
                step: '2',
                icon: ChefHat,
                title: 'Selecione receitas',
                desc: 'Escolha receitas para almoço e jantar de cada dia.',
              },
              {
                step: '3',
                icon: ListChecks,
                title: 'Salve sua semana',
                desc: 'Revise o cardápio visual e salve com um clique.',
              },
              {
                step: '4',
                icon: ShoppingCart,
                title: 'Lista de compras',
                desc: 'Sua lista é gerada automaticamente a partir das receitas.',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="relative rounded-2xl border p-6"
                style={{
                  backgroundColor: 'var(--color-surface-container-lowest)',
                  borderColor: 'var(--color-outline-variant)',
                }}
              >
                <div
                  className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl text-base font-bold text-white"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  {item.step}
                </div>
                <h3 className="mb-2 text-lg font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16" style={{ backgroundColor: 'var(--color-surface)' }}>
        <div className="container-app">
          <h2
            className="mb-10 text-center text-3xl font-bold"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Por que usar o {config.app.name}?
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              {
                emoji: '⏱️',
                title: 'Economize tempo',
                desc: 'Pare de decidir o que comer todos os dias. Planeje uma vez, use a semana toda.',
              },
              {
                emoji: '💰',
                title: 'Economize dinheiro',
                desc: 'Compre apenas o que precisa. A lista automática evita desperdício.',
              },
              {
                emoji: '🥗',
                title: 'Coma melhor',
                desc: 'Varie as refeições da semana com receitas balanceadas e práticas.',
              },
            ].map((benefit) => (
              <div
                key={benefit.title}
                className="rounded-2xl border p-6 text-center"
                style={{
                  backgroundColor: 'var(--color-surface-container-lowest)',
                  borderColor: 'var(--color-outline-variant)',
                }}
              >
                <div className="mb-3 text-4xl">{benefit.emoji}</div>
                <h3 className="mb-2 text-lg font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>
                  {benefit.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  {benefit.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section
        className="py-16"
        style={{ backgroundColor: 'var(--color-primary)' }}
      >
        <div className="container-app text-center">
          <Clock className="mx-auto mb-4 h-10 w-10 text-white opacity-80" />
          <h2 className="mb-4 text-3xl font-bold text-white" style={{ fontFamily: 'var(--font-heading)' }}>
            Pronto para organizar sua semana?
          </h2>
          <p className="mx-auto mb-8 max-w-md text-base text-white/80">
            Crie sua conta grátis agora e monte o cardápio da sua primeira semana.
          </p>
          <Link
            to="/auth/cadastro"
            className="inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-base font-semibold transition-all hover:opacity-90 no-underline"
            style={{
              backgroundColor: 'var(--color-surface-container-lowest)',
              color: 'var(--color-primary)',
            }}
          >
            Criar conta — é grátis
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}
