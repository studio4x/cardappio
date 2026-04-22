import { SEO } from '@/components/shared/SEO'
import { LifeBuoy, BookOpen, Rocket, ShieldCheck, Mail, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function SupportPage() {
  const supportCategories = [
    {
      icon: <Rocket className="h-6 w-6 text-blue-500" />,
      title: 'Primeiros Passos',
      desc: 'Aprenda a montar sua primeira semana e gerar listas.',
      href: '/como-funciona'
    },
    {
      icon: <ShieldCheck className="h-6 w-6 text-emerald-500" />,
      title: 'Conta e Planos',
      desc: 'Dúvidas sobre assinaturas, pagamentos e privacidade.',
      href: '/planos'
    },
    {
      icon: <BookOpen className="h-6 w-6 text-purple-500" />,
      title: 'Base de Conhecimento',
      desc: 'Dicas de culinária e como usar nossos filtros.',
      href: '/faq'
    }
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <SEO 
        title="Central de Suporte" 
        description="Encontre ajuda para configurar seu Cardappio e aproveitar ao máximo seus recursos."
      />
      
      {/* Hero */}
      <section className="bg-emerald-600 py-20 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6 text-white">
          <div className="flex justify-center">
            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
              <LifeBuoy className="h-8 w-8 text-emerald-50" />
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
            Central de Suporte
          </h1>
          <p className="text-lg text-emerald-50 max-w-2xl mx-auto leading-relaxed">
            Como podemos tornar sua experiência com o Cardappio ainda melhor hoje?
          </p>
        </div>
      </section>

      {/* Grid Categories */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid gap-6 md:grid-cols-3">
            {supportCategories.map((cat, idx) => (
              <Link 
                key={idx} 
                to={cat.href}
                className="group p-8 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all"
              >
                <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-slate-50 mb-6 group-hover:bg-emerald-50 group-hover:scale-110 transition-all">
                  {cat.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{cat.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-6">
                  {cat.desc}
                </p>
                <div className="flex items-center text-sm font-bold text-emerald-600">
                  Explorar categoria
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>

          {/* Direct Support Banner */}
          <div className="mt-20 p-10 bg-slate-900 rounded-[3rem] text-white flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold">Não encontrou o que precisava?</h2>
              <p className="text-slate-400">Nossa equipe responde em média em até 4 horas (horário comercial).</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <Button size="lg" className="rounded-full px-8 bg-emerald-600 hover:bg-emerald-700 font-bold h-14" asChild>
                <Link to="/contato">Abrir Ticket</Link>
              </Button>
              <Button variant="ghost" size="lg" className="rounded-full px-8 border border-white/20 hover:bg-white/10 font-bold h-14" asChild>
                <a href="mailto:suporte@cardappio.app">
                  <Mail className="h-5 w-5 mr-3" />
                  E-mail Direto
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
