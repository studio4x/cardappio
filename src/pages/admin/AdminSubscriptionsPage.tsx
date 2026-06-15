import { useState, useMemo } from 'react'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { useAdminSubscriptions, useUpdateSubscription, type AdminSubscription } from '@/hooks/admin/useAdminSubscriptions'
import { Check, Edit2, ShieldAlert, Sparkles, Calendar, DollarSign, Users, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function AdminSubscriptionsPage() {
  const { data: subscriptions, isLoading, error, refetch } = useAdminSubscriptions()
  const updateSubscription = useUpdateSubscription()

  const [search, setSearch] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  
  // Modal states
  const [isOpen, setIsOpen] = useState(false)
  const [editingSub, setEditingSub] = useState<AdminSubscription | null>(null)
  const [status, setStatus] = useState<AdminSubscription['status']>('active')
  const [tier, setTier] = useState<AdminSubscription['tier']>('plano-7-refeicoes')
  const [periodEnd, setPeriodEnd] = useState('')

  // Compute metrics
  const metrics = useMemo(() => {
    if (!subscriptions) return { totalActive: 0, mrr: 0, trialing: 0 }
    
    let totalActive = 0
    let mrr = 0
    let trialing = 0

    subscriptions.forEach(sub => {
      if (sub.status === 'active') {
        totalActive++
        const price = sub.plan?.price_monthly || 0
        if (sub.billing_cycle === 'monthly') {
          mrr += price
        } else if (sub.billing_cycle === 'yearly') {
          mrr += price / 12
        }
      } else if (sub.status === 'trialing') {
        trialing++
      }
    })

    return { totalActive, mrr, trialing }
  }, [subscriptions])

  // Filter subscriptions
  const filteredSubs = useMemo(() => {
    if (!subscriptions) return []
    return subscriptions.filter(sub => {
      const email = sub.profile?.email || ''
      const name = sub.profile?.full_name || ''
      const matchesSearch = email.toLowerCase().includes(search.toLowerCase()) || 
                            name.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = !selectedStatus || sub.status === selectedStatus
      return matchesSearch && matchesStatus
    })
  }, [subscriptions, search, selectedStatus])

  const handleOpenEdit = (sub: AdminSubscription) => {
    setEditingSub(sub)
    setStatus(sub.status)
    setTier(sub.tier)
    setPeriodEnd(sub.current_period_end ? sub.current_period_end.split('T')[0] : '')
    setIsOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingSub) return

    try {
      await updateSubscription.mutateAsync({
        id: editingSub.id,
        status,
        tier,
        current_period_end: periodEnd ? new Date(periodEnd).toISOString() : null
      })
      toast.success('Assinatura atualizada com sucesso!')
      setIsOpen(false)
      refetch()
    } catch (err) {
      toast.error('Erro ao atualizar assinatura')
    }
  }

  if (isLoading) return <LoadingState message="Carregando assinaturas..." />
  if (error) return <ErrorState onRetry={() => refetch()} />

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Assinaturas e Receitas" 
        subtitle="Gerencie faturamento, planos e prazos dos clientes." 
      />

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* MRR Card */}
        <div className="bg-white rounded-3xl border p-6 flex items-center gap-5 shadow-sm">
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">MRR Estimado</p>
            <h4 className="text-2xl font-black text-slate-900 mt-0.5">
              R$ {metrics.mrr.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h4>
          </div>
        </div>

        {/* Active Cards */}
        <div className="bg-white rounded-3xl border p-6 flex items-center gap-5 shadow-sm">
          <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assinantes Ativos</p>
            <h4 className="text-2xl font-black text-slate-900 mt-0.5">{metrics.totalActive}</h4>
          </div>
        </div>

        {/* Trialing Card */}
        <div className="bg-white rounded-3xl border p-6 flex items-center gap-5 shadow-sm">
          <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Em Degustação (Trial)</p>
            <h4 className="text-2xl font-black text-slate-900 mt-0.5">{metrics.trialing}</h4>
          </div>
        </div>
      </div>

      {/* Filter and Table Section */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Buscar por e-mail ou nome..." 
              className="pl-10 rounded-xl"
            />
          </div>

          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="rounded-xl border border-slate-200 p-2.5 text-sm outline-none bg-white min-w-[150px]"
          >
            <option value="">Todos os Status</option>
            <option value="active">Ativo</option>
            <option value="trialing">Degustação (Trial)</option>
            <option value="past_due">Atrasado (Past Due)</option>
            <option value="canceled">Cancelado</option>
          </select>
        </div>

        {/* Subscriptions Data Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="p-4">Assinante</th>
                <th className="p-4">Plano</th>
                <th className="p-4">Status</th>
                <th className="p-4">Ciclo</th>
                <th className="p-4">Validade / Renovação</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredSubs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400 font-medium">
                    Nenhuma assinatura correspondente encontrada.
                  </td>
                </tr>
              ) : (
                filteredSubs.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/50">
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{sub.profile?.full_name || 'Sem Nome'}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{sub.profile?.email}</div>
                      {sub.status === 'canceled' && sub.cancel_reason && (
                        <div className="text-xs text-rose-500 mt-1 italic max-w-xs break-words font-medium">
                          Motivo: "{sub.cancel_reason}"
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-800">{sub.plan?.name || 'Carregando...'}</div>
                      <div className="text-[10px] font-black uppercase text-primary tracking-widest mt-0.5">{sub.tier}</div>
                    </td>
                    <td className="p-4">
                      <span className={cn(
                        "inline-block px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                        sub.status === 'active' && "bg-emerald-50 text-emerald-600",
                        sub.status === 'trialing' && "bg-amber-50 text-amber-600",
                        sub.status === 'past_due' && "bg-rose-50 text-rose-600",
                        sub.status === 'canceled' && "bg-slate-100 text-slate-500"
                      )}>
                        {sub.status === 'active' ? 'Ativo' : sub.status === 'trialing' ? 'Trial' : sub.status === 'past_due' ? 'Atrasado' : 'Cancelado'}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-slate-600 capitalize">
                      {sub.billing_cycle === 'monthly' ? 'Mensal' : sub.billing_cycle === 'yearly' ? 'Anual' : 'Vitalício'}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString() : 'N/A'}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(sub)} className="rounded-full">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Editor Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>Editar Assinatura</DialogTitle>
          </DialogHeader>
          {editingSub && (
            <form onSubmit={handleSave} className="space-y-4 pt-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase">Usuário</p>
                <p className="font-bold text-slate-900 mt-1">{editingSub.profile?.full_name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{editingSub.profile?.email}</p>
              </div>

              <div className="space-y-1">
                <Label htmlFor="subStatus">Status do Pagamento</Label>
                <select 
                  id="subStatus" 
                  value={status} 
                  onChange={e => setStatus(e.target.value as any)}
                  className="w-full rounded-xl border p-2.5 text-sm border-slate-200 outline-none bg-white"
                >
                  <option value="active">Ativo</option>
                  <option value="trialing">Degustação (Trial)</option>
                  <option value="past_due">Atrasado (Past Due)</option>
                  <option value="canceled">Cancelado</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="subTier">Nível de Assinatura (Tier)</Label>
                <select 
                  id="subTier" 
                  value={tier} 
                  onChange={e => setTier(e.target.value as any)}
                  className="w-full rounded-xl border p-2.5 text-sm border-slate-200 outline-none bg-white"
                >
                  <option value="free">Gratuito (Free)</option>
                  <option value="plano-7-refeicoes">Plano 7 Refeições (Legado)</option>
                  <option value="plano-pro-7-dias">Plano PRO 7 Dias</option>
                  <option value="plano-14-refeicoes">Plano 14 Refeições (Legado)</option>
                  <option value="plano-pro-14-dias">Plano PRO 14 Dias</option>
                  <option value="premium">Premium Geral (Pro)</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="periodEnd">Expiração / Próxima Cobrança</Label>
                <Input 
                  id="periodEnd" 
                  type="date" 
                  value={periodEnd} 
                  onChange={e => setPeriodEnd(e.target.value)} 
                />
              </div>

              <div className="pt-2 flex items-start gap-2.5 text-xs text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-100">
                <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  Alterar o status ou tier manualmente afetará o acesso do usuário imediatamente. A sincronização com o gateway de pagamento (Stripe) continuará ativa no próximo evento de cobrança.
                </span>
              </div>

              <DialogFooter className="pt-4 gap-2">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="rounded-full">Cancelar</Button>
                <Button type="submit" className="rounded-full">Salvar Alterações</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
