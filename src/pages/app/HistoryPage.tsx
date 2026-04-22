import { useNavigate } from 'react-router-dom'
import { Clock, ChevronRight, Calendar } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { EmptyState } from '@/components/shared/EmptyState'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function HistoryPage() {
  const navigate = useNavigate()
  
  const { data: weeks, isLoading, error, refetch } = useQuery({
    queryKey: ['meal-weeks-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meal_plan_weeks')
        .select('*')
        .order('week_start_date', { ascending: false })
      
      if (error) throw error
      return data
    }
  })

  if (isLoading) return <LoadingState message="Buscando seu histórico..." />
  if (error) return <ErrorState onRetry={() => refetch()} />

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Meu Histórico" 
        subtitle="Reveja seus cardápios anteriores e reutilize o que deu certo."
      />

      {!weeks || weeks.length === 0 ? (
        <EmptyState 
          icon={<Clock className="h-8 w-8 text-muted-foreground" />}
          title="Histórico vazio"
          description="Suas semanas planejadas aparecerão aqui conforme você as cria."
        />
      ) : (
        <div className="space-y-3">
          {weeks.map((week) => (
            <button
              key={week.id}
              onClick={() => navigate(`/app/semana/${week.id}`)}
              className="group flex w-full items-center justify-between rounded-2xl border p-5 bg-white transition-all hover:shadow-md cursor-pointer text-left"
              style={{ borderColor: 'var(--color-outline-variant)' }}
            >
              <div className="flex items-center gap-4">
                <div className="rounded-xl p-3 bg-slate-50 text-slate-400 group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground">
                    Semana de {format(new Date(week.week_start_date), "dd 'de' MMMM", { locale: ptBR })}
                  </h4>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                    {week.status === 'active' ? 'Ativa' : 'Arquivada'}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
