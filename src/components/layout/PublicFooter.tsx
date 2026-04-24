import { Link } from 'react-router-dom'
import { Utensils } from 'lucide-react'
import { config } from '@/config'

export function PublicFooter() {
  return (
    <footer className="py-20 border-t border-neutral-100 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Utensils className="text-white h-5 w-5" />
              </div>
              <span className="text-xl font-black tracking-tighter text-on-surface">
                {config.app.name}
              </span>
            </div>
            <p className="text-text-secondary max-w-xs leading-relaxed">
              {config.app.tagline || 'A plataforma inteligente que devolve seu tempo livre e organiza sua vida na cozinha.'}
            </p>
          </div>
          
          <div className="space-y-6">
            <h5 className="text-sm font-black uppercase tracking-widest opacity-30">Produto</h5>
            <div className="flex flex-col gap-4">
              <Link to="/#como-funciona" className="text-sm font-bold text-on-surface/70 hover:text-primary transition-colors no-underline">Como funciona</Link>
              <Link to="/app/receitas" className="text-sm font-bold text-on-surface/70 hover:text-primary transition-colors no-underline">Receitas</Link>
              <Link to="/planos" className="text-sm font-bold text-on-surface/70 hover:text-primary transition-colors no-underline">Premium</Link>
            </div>
          </div>

          <div className="space-y-6">
            <h5 className="text-sm font-black uppercase tracking-widest opacity-30">Suporte</h5>
            <div className="flex flex-col gap-4">
              <Link to="/faq" className="text-sm font-bold text-on-surface/70 hover:text-primary transition-colors no-underline">FAQ</Link>
              <Link to="/contato" className="text-sm font-bold text-on-surface/70 hover:text-primary transition-colors no-underline">Contato</Link>
              <Link to="/privacidade" className="text-sm font-bold text-on-surface/70 hover:text-primary transition-colors no-underline">Privacidade</Link>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-center pt-10 border-t border-neutral-50 gap-6">
          <p className="text-xs text-text-secondary font-medium">© {new Date().getFullYear()} {config.app.name}. Todos os direitos reservados.</p>
          <div className="flex gap-8">
             <p className="text-xs text-text-secondary font-medium hover:text-on-surface cursor-pointer">Instagram</p>
             <p className="text-xs text-text-secondary font-medium hover:text-on-surface cursor-pointer">Twitter</p>
             <p className="text-xs text-text-secondary font-medium hover:text-on-surface cursor-pointer">TikTok</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
