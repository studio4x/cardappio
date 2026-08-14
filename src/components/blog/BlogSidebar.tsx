import { Link } from 'react-router-dom'
import { Sparkles, Calendar, ArrowRight, Utensils } from 'lucide-react'

export function BlogSidebar() {
  return (
    <aside className="space-y-6">
      {/* Promo Banner Block — Aspect 7/10 */}
      <div className="relative aspect-[7/10] w-full overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 p-6 text-white shadow-lg flex flex-col justify-between border border-emerald-500/20">
        {/* Background Subtle Accent */}
        <div className="absolute top-0 right-0 -mr-12 -mt-12 h-40 w-40 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-12 -mb-12 h-40 w-40 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-emerald-400 border border-emerald-500/30">
            <Sparkles className="h-3 w-3" />
            Cardappio Pro
          </div>

          <h3 className="text-xl font-black leading-tight text-white">
            Organize sua semana alimentar sem complicação
          </h3>

          <p className="text-xs leading-relaxed text-slate-300">
            Crie seu cardápio semanal personalizado, gere listas de compras automáticas e economize tempo na cozinha.
          </p>
        </div>

        <div className="relative z-10 space-y-3 pt-6 border-t border-white/10">
          <div className="space-y-2 text-xs text-slate-300 font-medium">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Calendar className="h-3 w-3" />
              </div>
              <span>Planejador semanal inteligente</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Utensils className="h-3 w-3" />
              </div>
              <span>Centenas de receitas fáceis</span>
            </div>
          </div>

          <Link
            to="/auth/cadastro"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 text-xs uppercase tracking-wider shadow-md transition-all active:scale-95"
          >
            Começar Grátis
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </aside>
  )
}
