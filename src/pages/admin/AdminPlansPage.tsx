import { useState } from 'react'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { useAdminPlans, useUpdatePlan, useCreatePlan, useDeletePlan, type AdminPlan } from '@/hooks/admin/useAdminPlans'
import { Check, Edit2, Zap, Globe, Trash2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'

export function AdminPlansPage() {
  const { data: plans, isLoading, error, refetch } = useAdminPlans()
  const updatePlan = useUpdatePlan()
  const createPlan = useCreatePlan()
  const deletePlan = useDeletePlan()

  const [isOpen, setIsOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<AdminPlan | null>(null)
  
  // Form states
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [priceMonthly, setPriceMonthly] = useState(0)
  const [priceYearly, setPriceYearly] = useState(0)
  const [trialDays, setTrialDays] = useState(0)
  const [featuresList, setFeaturesList] = useState<string[]>([])
  const [isActive, setIsActive] = useState(true)
  const [stripePriceIdMonthly, setStripePriceIdMonthly] = useState('')
  const [stripePriceIdYearly, setStripePriceIdYearly] = useState('')

  const handleOpenCreate = () => {
    setEditingPlan(null)
    setName('')
    setSlug('')
    setDescription('')
    setPriceMonthly(0)
    setPriceYearly(0)
    setTrialDays(21)
    setFeaturesList([
      "7 refeições por semana",
      "Repetição obrigatória almoço/jantar",
      "Lista de compras inteligente"
    ])
    setIsActive(true)
    setStripePriceIdMonthly('')
    setStripePriceIdYearly('')
    setIsOpen(true)
  }

  const handleOpenEdit = (plan: AdminPlan) => {
    setEditingPlan(plan)
    setName(plan.name)
    setSlug(plan.slug)
    setDescription(plan.description || '')
    setPriceMonthly(plan.price_monthly)
    setPriceYearly(plan.price_yearly)
    setTrialDays(21) // default trial
    setFeaturesList(plan.features || [])
    setIsActive(plan.is_active)
    setStripePriceIdMonthly(plan.stripe_price_id_monthly || '')
    setStripePriceIdYearly(plan.stripe_price_id_yearly || '')
    setIsOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    const payload = {
      name,
      slug,
      description,
      price_monthly: Number(priceMonthly),
      price_yearly: Number(priceYearly),
      trial_days: Number(trialDays),
      features: featuresList.map(f => f.trim()).filter(Boolean),
      is_active: isActive,
      stripe_price_id_monthly: stripePriceIdMonthly.trim() || null,
      stripe_price_id_yearly: stripePriceIdYearly.trim() || null,
    }

    try {
      if (editingPlan) {
        await updatePlan.mutateAsync({ id: editingPlan.id, ...payload })
        toast.success('Plano atualizado com sucesso!')
      } else {
        await createPlan.mutateAsync(payload)
        toast.success('Novo plano criado com sucesso!')
      }
      setIsOpen(false)
      refetch()
    } catch (err) {
      toast.error('Erro ao salvar o plano')
    }
  }

  const handleDelete = async (planId: string) => {
    if (!window.confirm('Deseja realmente excluir este plano? Esta ação é irreversível.')) return
    try {
      await deletePlan.mutateAsync(planId)
      toast.success('Plano excluído com sucesso!')
      refetch()
    } catch (err) {
      toast.error('Erro ao excluir o plano')
    }
  }

  const handleToggleActive = async (plan: AdminPlan) => {
    try {
      await updatePlan.mutateAsync({ id: plan.id, is_active: !plan.is_active })
      toast.success('Status do plano atualizado!')
      refetch()
    } catch (err) {
      toast.error('Erro ao alternar status do plano')
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
          <Button onClick={handleOpenCreate} className="rounded-full shadow-lg shadow-primary/20 flex items-center gap-2">
            <Plus className="h-4 w-4" /> Criar Novo Plano
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
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full"
                  onClick={() => handleOpenEdit(plan)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full hover:text-red-500"
                  onClick={() => handleDelete(plan.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-1 mb-6">
              <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
              <p className="text-sm text-slate-500 uppercase tracking-widest font-black">
                {plan.slug}
              </p>
              <p className="text-xs text-slate-400 line-clamp-2 mt-2">{plan.description}</p>
            </div>

            <div className="space-y-4 mb-8 flex-grow">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-slate-900">
                  R$ {plan.price_monthly.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-xs text-slate-500 font-bold uppercase">/mês</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-slate-600">
                  R$ {plan.price_yearly.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-xs text-slate-400 font-bold uppercase">/ano</span>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
              <button 
                onClick={() => handleToggleActive(plan)}
                className={`text-xs font-bold uppercase tracking-widest cursor-pointer ${
                  plan.is_active ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {plan.is_active ? 'Ativo (Clique p/ Inativar)' : 'Inativo (Clique p/ Ativar)'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Editor Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>{editingPlan ? 'Editar Plano' : 'Criar Novo Plano'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 pt-4">
            <div className="space-y-1">
              <Label htmlFor="name">Nome do Plano</Label>
              <Input id="name" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="slug">Slug Único</Label>
              <Input id="slug" value={slug} onChange={e => setSlug(e.target.value)} placeholder="ex: plano-7-refeicoes" required disabled={!!editingPlan} />
            </div>

            <div className="space-y-1">
              <Label htmlFor="description">Descrição</Label>
              <textarea 
                id="description" 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                className="w-full min-h-[80px] rounded-xl border p-2.5 text-sm outline-none border-slate-200 bg-white text-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="priceMonthly">Preço Mensal (R$)</Label>
                <Input id="priceMonthly" type="number" step="0.01" value={priceMonthly} onChange={e => setPriceMonthly(Number(e.target.value))} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="priceYearly">Preço Anual (R$)</Label>
                <Input id="priceYearly" type="number" step="0.01" value={priceYearly} onChange={e => setPriceYearly(Number(e.target.value))} required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="trialDays">Dias de Degustação</Label>
                <Input id="trialDays" type="number" value={trialDays} onChange={e => setTrialDays(Number(e.target.value))} required />
              </div>
              <div className="flex items-center gap-2 pt-8">
                <input id="isActive" type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-primary" />
                <Label htmlFor="isActive" className="cursor-pointer">Plano Ativo</Label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t pt-4 border-slate-100">
              <div className="space-y-1">
                <Label htmlFor="stripePriceIdMonthly">ID Preço Stripe (Mensal)</Label>
                <Input 
                  id="stripePriceIdMonthly" 
                  value={stripePriceIdMonthly} 
                  onChange={e => setStripePriceIdMonthly(e.target.value)} 
                  placeholder="price_..." 
                  className="bg-white text-slate-900"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="stripePriceIdYearly">ID Preço Stripe (Anual)</Label>
                <Input 
                  id="stripePriceIdYearly" 
                  value={stripePriceIdYearly} 
                  onChange={e => setStripePriceIdYearly(e.target.value)} 
                  placeholder="price_..." 
                  className="bg-white text-slate-900"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Recursos do Plano</Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setFeaturesList(prev => [...prev, ''])}
                  className="h-7 rounded-full text-xs flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" /> Adicionar
                </Button>
              </div>
              
              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {featuresList.map((feature, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <Input 
                      value={feature} 
                      onChange={e => {
                        const val = e.target.value
                        setFeaturesList(prev => prev.map((f, i) => i === idx ? val : f))
                      }} 
                      placeholder={`Recurso #${idx + 1}`}
                      className="flex-grow"
                    />
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setFeaturesList(prev => prev.filter((_, i) => i !== idx))}
                      className="h-9 w-9 rounded-xl hover:text-red-500 flex-shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {featuresList.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-2">Nenhum recurso adicionado ainda.</p>
                )}
              </div>
            </div>

            <DialogFooter className="pt-4 gap-2">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="rounded-full">Cancelar</Button>
              <Button type="submit" className="rounded-full">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
