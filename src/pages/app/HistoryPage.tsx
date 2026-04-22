import { useNavigate } from 'react-router-dom'
import { Clock, ChevronRight, Calendar, RefreshCw, Play } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { EmptyState } from '@/components/shared/EmptyState'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useRepeatWeek } from '@/hooks/planning/usePlanning'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function HistoryPage() {
  const navigate = useNavigate()
  const repeatWeek = useRepeatWeek()
  
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

  const handleRepeat = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    try {
      await repeatWeek.mutateAsync(id)
      toast.success('Semana repetida com sucesso!', {
        description: 'Você foi redirecionado para o planejamento atual.'
      })
      navigate('/app/semana')
    } catch (err) {
      toast.error('Erro ao repetir semana')
    }
  }

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
            <div
              key={week.id}
              onClick={() => navigate(`/app/semana/${week.id}`)}
              className="group flex w-full items-center justify-between rounded-3xl border p-6 bg-white transition-all hover:shadow-lg cursor-pointer text-left"
              style={{ borderColor: 'var(--color-outline-variant)' }}
            >
              <div className="flex items-center gap-5">
                <div className="rounded-2xl p-3.5 bg-slate-50 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-all">
                  <Calendar className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-lg">
                    {format(new Date(week.week_start_date), "dd 'de' MMMM", { locale: ptBR })}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                      week.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                    )}>
                      {week.status === 'active' ? 'Em uso' : 'Concluída'}
                    </span>
                    {week.source_week_id && (
                      <span className="text-[10px] font-bold text-slate-300 flex items-center gap-1">
                        <RefreshCw className="h-2.5 w-2.5" />
                        Repetida
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={(e) => handleRepeat(e, week.id)}
                  disabled={repeatWeek.isPending}
                  className="rounded-full flex items-center gap-2 font-bold text-xs bg-slate-50 hover:bg-emerald-600 hover:text-white transition-all"
                >
                  {repeatWeek.isPending ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3 fill-current" />}
                  Repetir
                </Button>
                <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-emerald-500 transition-colors" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
