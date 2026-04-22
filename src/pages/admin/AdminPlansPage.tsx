import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { useAdminPlans, useUpdatePlan } from '@/hooks/admin/useAdminPlans'
import { Check, Edit2, Zap, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function AdminPlansPage() {
  const { data: plans, isLoading, error, refetch } = useAdminPlans()
  const updatePlan = useUpdatePlan()

  const handleToggleActive = async (planId: string, currentStatus: boolean) => {
    try {
      await updatePlan.mutateAsync({ id: planId, is_active: !currentStatus })
      toast.success('Status do plano atualizado')
    } catch (err) {
      toast.error('Erro ao atualizar plano')
    }
  }

  if (isLoading) return <LoadingState message="Carregando planos..." />
  if (error) return <ErrorState onRetry={() => refetch()} />

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Planos e Assinaturas" 
        subtitle="Gerencie ofertas e configurações de precificação."
        actions={
          <Button className="rounded-full shadow-lg shadow-primary/20">
            Criar Novo Plano
          </Button>
        }
      />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {plans?.map((plan) => (
          <div 
            key={plan.id}
            className={`relative flex flex-col rounded-[2.5rem] border p-8 bg-white transition-all hover:shadow-md ${
              !plan.is_active ? 'opacity-60 grayscale' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full"
                onClick={() => handleToggleActive(plan.id, plan.is_active)}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-1 mb-6">
              <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
              <p className="text-sm text-slate-500 uppercase tracking-widest font-black">
                {plan.slug}
              </p>
            </div>

            <div className="space-y-4 mb-8 flex-grow">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-slate-900">
                  R$ {plan.price_monthly.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-xs text-slate-500 font-bold uppercase">/mês</span>
              </div>

              <div className="pt-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  <Globe className="h-3 w-3" /> Stripe Config
                </div>
                <div className="text-[10px] font-mono bg-slate-50 p-2 rounded-lg break-all">
                  Monthly: {plan.stripe_price_id_monthly || 'N/A'}<br/>
                  Yearly: {plan.stripe_price_id_yearly || 'N/A'}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
              <span className={`text-xs font-bold uppercase tracking-widest ${
                plan.is_active ? 'text-emerald-600' : 'text-rose-600'
              }`}>
                {plan.is_active ? 'Ativo' : 'Inativo'}
              </span>
              <div className="flex -space-x-1">
                {/* Visual indicator of features count */}
                {plan.features?.slice(0, 4).map((_, i) => (
                  <div key={i} className="h-2 w-2 rounded-full bg-primary/30 border border-white" />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
