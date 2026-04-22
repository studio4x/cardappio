import { Users, UtensilsCrossed, CreditCard, ShieldCheck, TrendingUp, Calendar } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingState } from '@/components/shared/LoadingState'
import { useAdminMetrics } from '@/hooks/admin/useAdminMetrics'
import { cn } from '@/lib/utils'

export function AdminDashboardPage() {
  const { data: stats, isLoading } = useAdminMetrics()

  if (isLoading) return <LoadingState message="Buscando métricas..." />

  const cards = [
    { label: 'Usuários Totais', value: stats?.totalUsers || 0, icon: Users, color: 'bg-blue-500' },
    { label: 'Receitas Publicadas', value: stats?.publishedRecipes || 0, icon: UtensilsCrossed, color: 'bg-emerald-500' },
    { label: 'Assinaturas Ativas', value: stats?.activeSubscriptions || 0, icon: CreditCard, color: 'bg-amber-500' },
    { label: 'Administradores', value: stats?.adminUsers || 0, icon: ShieldCheck, color: 'bg-indigo-500' },
  ]

  return (
    <div className="space-y-8">
      <PageHeader
        title="Admin Dashboard"
        subtitle="Visão geral da plataforma e métricas de engajamento."
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border bg-white p-6 shadow-sm transition-hover hover:shadow-md"
            style={{ borderColor: 'var(--color-outline-variant)' }}
          >
            <div className="flex items-center gap-4">
              <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl text-white", card.color)}>
                <card.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
                <h3 className="text-2xl font-bold">{card.value.toLocaleString()}</h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Placeholder Charts / Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div 
          className="rounded-2xl border bg-white p-6"
          style={{ borderColor: 'var(--color-outline-variant)' }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold">Crescimento (Usuários)</h3>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="flex h-64 items-center justify-center rounded-xl bg-slate-50 border-2 border-dashed border-slate-100">
            <p className="text-sm text-muted-foreground italic">Gráfico em desenvolvimento...</p>
          </div>
        </div>

        <div 
          className="rounded-2xl border bg-white p-6"
          style={{ borderColor: 'var(--color-outline-variant)' }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold">Atividade Recente</h3>
            <Calendar className="h-4 w-4 text-primary" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-4 items-center p-3 rounded-xl bg-slate-50/50">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Nova receita cadastrada</p>
                  <p className="text-[10px] text-muted-foreground">Há {i * 10} minutos</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
