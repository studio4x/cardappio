import { Users, UtensilsCrossed, CreditCard, TrendingUp, Percent } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AdminReportCardsProps {
  stats: {
    totalUsers: number
    premiumUsers: number
    publishedRecipes: number
    conversionRate: number
    recentActivityCount: number
  }
}

export function AdminReportCards({ stats }: AdminReportCardsProps) {
  const cards = [
    { 
      label: 'Usuários Totais', 
      value: stats.totalUsers, 
      icon: Users, 
      color: 'bg-blue-500', 
      description: 'Crescimento orgânico' 
    },
    { 
      label: 'Receitas no Catálogo', 
      value: stats.publishedRecipes, 
      icon: UtensilsCrossed, 
      color: 'bg-emerald-500', 
      description: 'Acervo editorial' 
    },
    { 
      label: 'Assinaturas Pro', 
      value: stats.premiumUsers, 
      icon: CreditCard, 
      color: 'bg-amber-500', 
      description: 'Receita recorrente' 
    },
    { 
      label: 'Taxa de Conversão', 
      value: `${stats.conversionRate.toFixed(1)}%`, 
      icon: Percent, 
      color: 'bg-indigo-500', 
      description: 'Eficiência de vendas' 
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-[2rem] border bg-white p-7 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1"
          style={{ borderColor: 'var(--color-outline-variant)' }}
        >
          <div className="flex flex-col gap-4">
            <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg", card.color)}>
              <card.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">{card.label}</p>
              <h3 className="text-3xl font-black text-slate-900">{card.value.toLocaleString()}</h3>
              <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1 font-medium">
                <TrendingUp className="h-3 w-3 text-emerald-500" />
                {card.description}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
