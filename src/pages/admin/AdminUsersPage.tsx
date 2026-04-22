import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { useAdminUsers, useUpdateUserRole } from '@/hooks/admin/useAdminUsers'
import { MoreHorizontal, UserCheck, Shield, ShieldAlert, UserX } from 'lucide-react'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'

export function AdminUsersPage() {
  const { data: users, isLoading, error, refetch } = useAdminUsers()
  const updateRole = useUpdateUserRole()

  const handleRoleUpdate = async (userId: string, role: any) => {
    try {
      await updateRole.mutateAsync({ userId, role })
      toast.success('Permissão atualizada com sucesso')
    } catch (err) {
      toast.error('Erro ao atualizar permissão')
    }
  }

  if (isLoading) return <LoadingState message="Carregando usuários..." />
  if (error) return <ErrorState onRetry={() => refetch()} />

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Gestão de Usuários" 
        subtitle={`Total: ${users?.length || 0} usuários cadastrados.`}
      />

      <div className="rounded-2xl border bg-white overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b text-xs font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-6 py-4">Usuário</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Cadastro</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {users?.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback>{user.full_name?.charAt(0) || user.email.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900">{user.full_name || 'Sem nome'}</span>
                      <span className="text-xs text-slate-500">{user.email}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {user.role === 'super_admin' && <ShieldAlert className="h-4 w-4 text-purple-600" />}
                    {user.role === 'admin' && <Shield className="h-4 w-4 text-blue-600" />}
                    {user.role === 'user' && <UserCheck className="h-4 w-4 text-slate-400" />}
                    <span className="capitalize">{user.role}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                  }`}>
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-500">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-full">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl border shadow-lg">
                      <div className="px-2 py-1.5 text-xs font-bold text-slate-400 uppercase tracking-widest">
                        Alterar Role
                      </div>
                      <DropdownMenuItem onClick={() => handleRoleUpdate(user.id, 'user')}>
                        Tornar Usuário
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleRoleUpdate(user.id, 'admin')}>
                        Tornar Admin
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-rose-600">
                        <UserX className="h-4 w-4 mr-2" />
                        Suspender Acesso
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
