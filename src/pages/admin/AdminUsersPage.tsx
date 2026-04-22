import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { Users } from 'lucide-react'

export function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Gestão de Usuários" 
        subtitle="Visualize e gerencie as contas de usuários da plataforma."
      />

      <EmptyState 
        icon={<Users className="h-8 w-8 text-muted-foreground" />}
        title="Módulo em fase de auditoria"
        description="A listagem de usuários está sendo migrada para o padrão de Edge Functions para maior segurança."
      />
    </div>
  )
}
