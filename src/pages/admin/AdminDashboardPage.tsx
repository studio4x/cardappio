import { TrendingUp, Calendar } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingState } from '@/components/shared/LoadingState'
import { useAdminMetrics } from '@/hooks/admin/useAdminMetrics'
import { AdminReportCards } from '@/components/admin/AdminReportCards'

export function AdminDashboardPage() {
  const { data: stats, isLoading } = useAdminMetrics()

  if (isLoading) return <LoadingState message="Buscando métricas..." />

  return (
    <div className="space-y-8">
      <PageHeader
        title="Admin Dashboard"
        subtitle="Visão geral da plataforma e métricas de engajamento."
      />

      {/* Metric Cards */}
      {stats && <AdminReportCards stats={stats} />}

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
