import { Link } from 'react-router-dom'
import { Utensils, ArrowRight, Clock, Star, PiggyBank } from 'lucide-react'
import { config } from '@/config'
import { SEO } from '@/components/shared/SEO'

export function LandingPage() {
  return (
    <div className="bg-off-white">
      <SEO 
        title="Cardappio - Planeje sua semana, simplifique sua rotina" 
        description="Assuma o controle da sua alimentação com um planejador inteligente. Economize tempo no mercado e garanta refeições saudáveis todos os dias."
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden px-5 pt-16 pb-24 lg:pt-32 lg:pb-40" style={{ backgroundColor: 'var(--color-surface)' }}>
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center text-left">
          <div className="z-10">
            <span 
              className="inline-block px-4 py-1 rounded-full font-semibold mb-6 text-sm"
              style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 10%, transparent)', color: 'var(--color-primary)' }}
            >
              Sua cozinha sob controle
            </span>
            <h1 className="font-bold text-[40px] lg:text-[56px] leading-[1.1] mb-6" style={{ color: 'var(--color-text-primary)' }}>
              Planeje sua semana, <span style={{ color: 'var(--color-fresh-green)' }}>simplifique</span> sua rotina
            </h1>
            <p className="text-lg lg:text-xl mb-10 max-w-lg leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              Assuma o controle da sua alimentação com um planejador inteligente. Economize tempo no mercado e garanta refeições saudáveis todos os dias.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/auth/cadastro"
                className="bg-fresh-green text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-all no-underline text-center"
                style={{ backgroundColor: 'var(--color-fresh-green)' }}
              >
                Começar Planejamento Grátis
              </Link>
              <Link
                to="/como-funciona"
                className="bg-white border text-text-primary px-8 py-4 rounded-xl font-bold text-lg hover:bg-neutral-50 active:scale-95 transition-all no-underline text-center"
                style={{ borderColor: 'var(--color-outline-variant)' }}
              >
                Ver Exemplos
              </Link>
            </div>
          </div>

          <div className="relative lg:h-[500px]">
            <div className="absolute -top-10 -right-10 w-64 h-64 bg-primary-container opacity-20 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-tertiary opacity-10 rounded-full blur-3xl"></div>
            <div className="bg-white rounded-3xl p-4 shadow-2xl border border-neutral-100 relative z-10 rotate-2">
              <img 
                alt="Meal Planning Interface" 
                className="rounded-2xl w-full h-auto object-cover" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBeFYNhHm61H7_-QuP6DL5I8HcFp5s1UgGi1lZJOTRr-SGcMcQcQoscs1Bp3W0zPm-7CPDeb2DY-3EQStY3e9vFWXyAJv4JL2MRTRGmnBctO5fIqurF6f4nDcg1UZ46fK5rCmFtOtkdrz6kwOBlUdd2Yqg0kKH3n-rIfLwgTMdvAcBzrzwFf3CPScqXjP7bkUnb8G2XzZVruTYSQ24207aDRtG6lqOEdMCcDJnlHQB3XOe3yL8685E6_x5LxtcX9-LlqUHTMiSmtKW9"
              />
              <div 
                className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl border border-neutral-100 max-w-[180px] -rotate-3"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Receita do Dia</span>
                </div>
                <p className="text-sm font-bold">Bowl de Quinoa e Vegetais</p>
                <p className="text-[10px] text-text-secondary">20 min • Saudável</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Section */}
      <section className="bg-white py-20 px-5" id="beneficios">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Por que usar o {config.app.name}?</h2>
            <p className="text-lg text-text-secondary max-w-xl mx-auto">
              Transformamos a tarefa de cozinhar em um momento de prazer e organização para sua família.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div 
              className="p-8 rounded-3xl border transition-shadow hover:shadow-md"
              style={{ backgroundColor: 'var(--color-surface-container-low)', borderColor: 'var(--color-outline-variant)' }}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6" style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary-container) 20%, transparent)' }}>
                <Clock className="h-6 w-6" style={{ color: 'var(--color-fresh-green)' }} />
              </div>
              <h3 className="text-xl font-bold mb-3">Ganhe Tempo</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Diga adeus à pergunta "o que vamos comer hoje?". Planeje em minutos e recupere horas da sua semana.
              </p>
            </div>

            <div 
              className="p-8 rounded-3xl border transition-shadow hover:shadow-md"
              style={{ backgroundColor: 'var(--color-surface-container-low)', borderColor: 'var(--color-outline-variant)' }}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6" style={{ backgroundColor: 'color-mix(in srgb, var(--color-tertiary) 10%, transparent)' }}>
                <PiggyBank className="h-6 w-6" style={{ color: 'var(--color-tertiary)' }} />
              </div>
              <h3 className="text-xl font-bold mb-3">Economize Dinheiro</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Com uma lista de compras precisa baseada no seu plano, você evita desperdícios e compras por impulso.
              </p>
            </div>

            <div 
              className="p-8 rounded-3xl border transition-shadow hover:shadow-md"
              style={{ backgroundColor: 'var(--color-surface-container-low)', borderColor: 'var(--color-outline-variant)' }}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6" style={{ backgroundColor: 'color-mix(in srgb, var(--color-info) 20%, transparent)' }}>
                <Utensils className="h-6 w-6" style={{ color: 'var(--color-info)' }} />
              </div>
              <h3 className="text-xl font-bold mb-3">Coma Melhor</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Escolha receitas nutritivas e variadas. Sua saúde e paladar agradecem o planejamento consciente.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-20 px-5" style={{ backgroundColor: 'var(--color-surface-bright)' }} id="como-funciona">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="h-64 rounded-2xl overflow-hidden shadow-lg border border-white/20">
                  <img 
                    alt="Prepare" 
                    className="w-full h-full object-cover" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCdiO24GRYAUJ3RHsqhpPIF5lKdPqMAJ7tNtPhHw7-m1Upu80NRTixi1abpYnEuvQ-90fM6D1zWw86_CTTtU4YynVD3j-3zWIyWCby6Eg84EtrLjpozu8Y8ytUz955m59BHssJa0pBQxisVGWErc5RBbMGtSwemUX8mt7SGrtgy8WiFVgg3YZ3VrcsBeDVpUZtu2jTmXuTFR3Ty_L_lOtNGE7AvS0VvsFXUVLtVJx_JYWpXlSw_AbQnjubrfw0ttGrg0XKLwh4oSE0Z"
                  />
                </div>
                <div 
                  className="h-40 rounded-2xl flex items-center justify-center p-6 text-white"
                  style={{ backgroundColor: 'var(--color-fresh-green)' }}
                >
                  <p className="text-xl font-bold text-center">Organização Total</p>
                </div>
              </div>
              <div className="space-y-4 pt-8">
                <div 
                  className="h-40 rounded-2xl flex items-center justify-center p-6 text-white"
                  style={{ backgroundColor: 'var(--color-secondary-container)' }}
                >
                  <p className="text-xl font-bold text-center">Menos Estresse</p>
                </div>
                <div className="h-64 rounded-2xl overflow-hidden shadow-lg border border-white/20">
                  <img 
                    alt="Enjoy" 
                    className="w-full h-full object-cover" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDw3TFfhq3ybPAq0IxcaBpkKQUuwGnleOZyVUe2BpqC4F0BlI7rx5VJMXJpAIboD0tmGCfuYbWyxvHCKBFdGlZ6VEfT2UhvUBvd0KTyJnBlP35NX_TVfM8FHESvO9fzNIoOFEXwwLNDNeoDYbyLSAYG68WuYX7zjgYpG5GAG5Txue7Sv_WYDoCGVIxWcWTD5_Cfl9SQz09kFsUBgRALBBMe4SHNmqu6z-fhUSq2uSZcFpHrm6sTCTmEdZ46uXp0b0YeE3mWUFoQAdwZ"
                  />
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <h2 className="text-3xl font-bold mb-12">Como funciona o {config.app.name}</h2>
              <div className="space-y-10">
                {[
                  { step: 1, title: 'Escolha suas receitas', desc: 'Navegue por centenas de opções saudáveis ou adicione as suas favoritas em segundos.' },
                  { step: 2, title: 'Monte seu calendário', desc: 'Arraste as receitas para os dias da semana. Almoço, jantar e lanches organizados.' },
                  { step: 3, title: 'Gere sua lista de compras', desc: 'Pronto! O sistema gera uma lista automática com tudo o que você precisa comprar.' }
                ].map((item) => (
                  <div key={item.step} className="flex gap-6">
                    <div 
                      className="flex-shrink-0 w-12 h-12 bg-white border-2 rounded-full flex items-center justify-center font-bold text-xl transition-all"
                      style={{ borderColor: 'var(--color-fresh-green)', color: 'var(--color-fresh-green)' }}
                    >
                      {item.step}
                    </div>
                    <div>
                      <h4 className="text-xl font-bold mb-2">{item.title}</h4>
                      <p className="text-text-secondary leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-5">
        <div className="max-w-4xl mx-auto rounded-[40px] p-12 md:p-16 text-center text-white relative overflow-hidden bg-slate-900">
          <div className="absolute top-0 right-0 w-64 h-64 bg-fresh-green opacity-20 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-tertiary opacity-10 rounded-full blur-[100px]"></div>
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Pronto para transformar sua rotina na cozinha?</h2>
            <p className="text-lg text-neutral-300 mb-10">Junte-se a milhares de pessoas que já simplificaram suas vidas com o Cardappio.</p>
            <Link
              to="/auth/cadastro"
              className="bg-fresh-green text-white px-10 py-5 rounded-2xl font-bold text-xl shadow-xl hover:bg-success-green active:scale-95 transition-all no-underline inline-block"
              style={{ backgroundColor: 'var(--color-fresh-green)' }}
            >
              Começar Agora Grátis
            </Link>
            <p className="mt-6 text-sm text-neutral-400">Sem cartão de crédito • Cancele quando quiser</p>
          </div>
        </div>
      </section>
    </div>
  )
}
