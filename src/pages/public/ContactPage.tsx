import { SEO } from '@/components/shared/SEO'
import { Mail, MessageSquare, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ContactPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <SEO 
        title="Contato" 
        description="Fale com a equipe do Cardappio para suporte, sugestões ou parcerias."
      />
      
      {/* Header */}
      <section className="bg-white py-16 px-6 sm:py-24">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="flex justify-center">
            <div className="p-3 bg-emerald-100 rounded-2xl">
              <Mail className="h-8 w-8 text-emerald-600" />
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900" style={{ fontFamily: 'var(--font-heading)' }}>
            Fale com a <span className="text-emerald-600">Gente</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Tem alguma dúvida, sugestão ou precisa de ajuda? Use o formulário abaixo ou nossos canais diretos.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto grid gap-12 lg:grid-cols-2 lg:items-start">
          
          {/* Info cards */}
          <div className="space-y-6">
            <div className="p-8 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-10 w-10 flex items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <Mail className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg">E-mail Direto</h3>
              </div>
              <p className="text-slate-600 mb-2">Ideal para questões administrativas e parcerias.</p>
              <a href="mailto:contato@cardappio.app" className="text-emerald-600 font-bold hover:underline">contato@cardappio.app</a>
            </div>

            <div className="p-8 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-10 w-10 flex items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg">Suporte ao Usuário</h3>
              </div>
              <p className="text-slate-600 mb-2">Se você já é usuário Pro e precisa de ajuda técnica.</p>
              <a href="mailto:suporte@cardappio.app" className="text-emerald-600 font-bold hover:underline">suporte@cardappio.app</a>
            </div>
          </div>

          {/* Form */}
          <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-lg shadow-slate-200/50">
            <h2 className="text-2xl font-bold text-slate-900 mb-8">Envie uma mensagem</h2>
            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Nome Completo</label>
                <input 
                  type="text" 
                  placeholder="Seu nome"
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">E-mail</label>
                <input 
                  type="email" 
                  placeholder="seu@email.com"
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Assunto</label>
                <select className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all">
                  <option>Dúvida sobre planos</option>
                  <option>Sugestão de receita</option>
                  <option>Relato de erro (bug)</option>
                  <option>Parceria comercial</option>
                  <option>Outro</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Mensagem</label>
                <textarea 
                  rows={4} 
                  placeholder="Como podemos ajudar?"
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
                />
              </div>
              <Button size="lg" className="w-full rounded-full py-7 font-bold bg-emerald-600 hover:bg-emerald-700 shadow-md">
                <Send className="h-5 w-5 mr-2" />
                Enviar Mensagem
              </Button>
            </form>
          </div>

        </div>
      </section>
    </div>
  )
}
