import { Link } from 'react-router-dom'
import { HelpCircle, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SEO } from '@/components/shared/SEO'
import { useState } from 'react'

export function FaqPage() {
  const faqs = [
    {
      question: "O Cardappio é gratuito?",
      answer: "Sim! Oferecemos um plano gratuito que permite planejar até 3 dias por semana e acessar nossas receitas básicas. Para recursos ilimitados, oferecemos o plano Pro."
    },
    {
      question: "Como funciona a lista de compras?",
      answer: "Assim que você finaliza o planejamento da sua semana, o Cardappio consolida todos os ingredientes necessários em uma única lista organizada por categorias, facilitando sua ida ao mercado."
    },
    {
      question: "Posso cancelar minha assinatura Pro a qualquer momento?",
      answer: "Sim, você pode cancelar sua assinatura Pro quando desejar diretamente nas configurações do seu perfil. Você manterá o acesso aos recursos Pro até o final do período já pago."
    },
    {
      question: "As receitas são saudáveis?",
      answer: "Nossa biblioteca conta com uma grande variedade de receitas. Você pode usar filtros para encontrar opções de acordo com suas preferências e restrições alimentares."
    }
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <SEO 
        title="Perguntas Frequentes" 
        description="Tire suas dúvidas sobre como usar o Cardappio para organizar sua alimentação semanal."
      />
      
      {/* Header */}
      <section className="bg-white py-16 px-6 sm:py-24">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="flex justify-center">
            <div className="p-3 bg-emerald-100 rounded-2xl">
              <HelpCircle className="h-8 w-8 text-emerald-600" />
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900" style={{ fontFamily: 'var(--font-heading)' }}>
            Como podemos <span className="text-emerald-600">ajudar?</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Encontre respostas para as dúvidas mais comuns sobre o Cardappio.
          </p>
        </div>
      </section>

      {/* FAQ List */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, idx) => (
            <FaqItem key={idx} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 text-center">
        <div className="max-w-2xl mx-auto space-y-8 p-12 rounded-[3rem] bg-emerald-50 border border-emerald-100 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">Ainda tem dúvidas?</h2>
          <p className="text-slate-600">Nossa equipe de suporte está pronta para ajudar você com qualquer questão.</p>
          <Button size="lg" className="rounded-full px-8 bg-emerald-600 hover:bg-emerald-700 shadow-md" asChild>
            <Link to="/contato">Entre em contato</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}

function FaqItem({ question, answer }: { question: string, answer: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div 
      className={`rounded-2xl border bg-white transition-all overflow-hidden ${
        isOpen ? 'border-emerald-200 shadow-md' : 'border-slate-200'
      }`}
    >
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
      >
        <span className="font-bold text-slate-900">{question}</span>
        <ChevronDown 
          className={`h-5 w-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-emerald-600' : ''}`} 
        />
      </button>
      {isOpen && (
        <div className="px-6 pb-6 text-slate-600 leading-relaxed text-sm animate-in fade-in slide-in-from-top-2">
          {answer}
        </div>
      )}
    </div>
  )
}
