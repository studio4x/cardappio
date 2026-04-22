import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { CreditCard } from 'lucide-react'

export function AdminPlansPage() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Planos e Preços" 
        subtitle="Gerencie os tiers de assinatura e valores do sistema."
      />

      <EmptyState 
        icon={<CreditCard className="h-8 w-8 text-muted-foreground" />}
        title="Gestão de Planos"
        description="Configure os stripe_price_ids e recursos de cada tier aqui."
      />
    </div>
  )
}
