import { useState } from 'react'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { 
  useAdminUsers, 
  useUpdateUserRole, 
  useCreateUser, 
  useResetUserPassword,
  useDeleteUser,
  useSendPasswordResetLink,
  useUpdateUserPlan
} from '@/hooks/admin/useAdminUsers'
import { 
  MoreHorizontal, 
  UserCheck, 
  Shield, 
  ShieldAlert, 
  UserX, 
  Plus, 
  Key,
  Mail,
  User as UserIcon,
  Eye,
  EyeOff,
  Copy,
  CreditCard
} from 'lucide-react'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { toast } from 'sonner'

export function AdminUsersPage() {
  const { data: users, isLoading, error, refetch } = useAdminUsers()
  const updateRole = useUpdateUserRole()
  const createUser = useCreateUser()
  const resetPassword = useResetUserPassword()
  const deleteUser = useDeleteUser()
  const sendResetLink = useSendPasswordResetLink()
  const updatePlan = useUpdateUserPlan()

  // State for Update Plan Dialog
  const [isPlanOpen, setIsPlanOpen] = useState(false)
  const [planTarget, setPlanTarget] = useState<{id: string, email: string, currentTier: string} | null>(null)
  const [selectedPlanTier, setSelectedPlanTier] = useState('free')

  const handleUpdatePlan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!planTarget) return
    try {
      await updatePlan.mutateAsync({ userId: planTarget.id, planTier: selectedPlanTier })
      toast.success('Plano do usuário atualizado com sucesso')
      setIsPlanOpen(false)
      setPlanTarget(null)
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atualizar plano')
    }
  }

  // State for Create User Dialog
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newUserData, setNewUserData] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'user'
  })
  const [showCreatePassword, setShowCreatePassword] = useState(false)

  // State for Reset Password Dialog
  const [isResetOpen, setIsResetOpen] = useState(false)
  const [resetTarget, setResetTarget] = useState<{id: string, email: string} | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // State for Delete User Dialog
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{id: string, email: string} | null>(null)

  const handleRoleUpdate = async (userId: string, role: any) => {
    try {
      await updateRole.mutateAsync({ userId, role })
      toast.success('Permissão atualizada com sucesso')
    } catch (err) {
      toast.error('Erro ao atualizar permissão')
    }
  }

  const handleCopyCreatePassword = () => {
    if (!newUserData.password) {
      toast.error('Digite uma senha para copiar')
      return
    }
    navigator.clipboard.writeText(newUserData.password)
    toast.success('Senha copiada para a área de transferência')
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createUser.mutateAsync(newUserData)
      toast.success('Usuário criado com sucesso')
      setIsCreateOpen(false)
      setNewUserData({ email: '', password: '', fullName: '', role: 'user' })
      setShowCreatePassword(false)
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar usuário')
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetTarget) return
    try {
      await resetPassword.mutateAsync({ userId: resetTarget.id, newPassword })
      toast.success('Senha redefinida com sucesso')
      setIsResetOpen(false)
      setNewPassword('')
      setResetTarget(null)
    } catch (err: any) {
      toast.error(err.message || 'Erro ao redefinir senha')
    }
  }

  const handleDeleteUser = async () => {
    if (!deleteTarget) return
    try {
      await deleteUser.mutateAsync({ userId: deleteTarget.id })
      toast.success('Usuário excluído com sucesso')
      setIsDeleteOpen(false)
      setDeleteTarget(null)
    } catch (err: any) {
      toast.error(err.message || 'Erro ao excluir usuário')
    }
  }

  const handleSendResetLink = async (email: string) => {
    const toastId = toast.loading('Enviando e-mail de redefinição de senha...')
    try {
      await sendResetLink.mutateAsync({ email })
      toast.success('E-mail de redefinição de senha enviado com sucesso!', { id: toastId })
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar e-mail de redefinição', { id: toastId })
    }
  }

  if (isLoading) return <LoadingState message="Carregando usuários..." />
  if (error) return <ErrorState onRetry={() => refetch()} />

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader 
          title="Gestão de Usuários" 
          subtitle={`Total: ${users?.length || 0} usuários cadastrados.`}
        />
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2 px-6">
          <Plus className="h-4 w-4" />
          Novo Usuário
        </Button>
      </div>

      <div className="rounded-2xl border bg-white overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b text-xs font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-6 py-4">Usuário</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Plano</th>
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
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-slate-700 capitalize">
                      {user.subscription_tier === 'plano-7-refeicoes' || user.subscription_tier === 'plano-pro-7-dias' ? 'PRO 7 Dias' : 
                       user.subscription_tier === 'plano-14-refeicoes' || user.subscription_tier === 'plano-pro-14-dias' ? 'PRO 14 Dias' : 
                       user.subscription_tier === 'plano-gratuito' || user.subscription_tier === 'free' ? 'Gratuito' : 
                       user.subscription_tier || 'Gratuito'}
                    </span>
                    {user.subscription_until && (
                      <span className="text-[10px] text-slate-400">
                        Até {new Date(user.subscription_until).toLocaleDateString()}
                      </span>
                    )}
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
                    <DropdownMenuContent align="end" className="w-48 rounded-xl border shadow-lg">
                      <div className="px-2 py-1.5 text-xs font-bold text-slate-400 uppercase tracking-widest">
                        Ações
                      </div>
                      <DropdownMenuItem onClick={() => handleRoleUpdate(user.id, user.role === 'admin' ? 'user' : 'admin')}>
                        {user.role === 'admin' ? 'Rebaixar para Usuário' : 'Promover para Admin'}
                      </DropdownMenuItem>
                       <DropdownMenuItem onClick={() => {
                        setPlanTarget({id: user.id, email: user.email, currentTier: user.subscription_tier || 'free'})
                        setSelectedPlanTier(user.subscription_tier || 'free')
                        setIsPlanOpen(true)
                      }}>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Alterar Plano
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        setResetTarget({id: user.id, email: user.email})
                        setIsResetOpen(true)
                      }}>
                        <Key className="h-4 w-4 mr-2" />
                        Definir Nova Senha
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSendResetLink(user.email)}>
                        <Mail className="h-4 w-4 mr-2" />
                        Enviar Link de Redefinição
                      </DropdownMenuItem>
                      <div className="h-px bg-slate-100 my-1" />
                      <DropdownMenuItem className="text-rose-600">
                        <UserX className="h-4 w-4 mr-2" />
                        Suspender Acesso
                      </DropdownMenuItem>
                      {user.role !== 'admin' && user.role !== 'super_admin' && (
                        <>
                          <div className="h-px bg-slate-100 my-1" />
                          <DropdownMenuItem 
                            className="text-rose-600 focus:bg-rose-50 focus:text-rose-700 cursor-pointer"
                            onClick={() => {
                              setDeleteTarget({ id: user.id, email: user.email })
                              setIsDeleteOpen(true)
                            }}
                          >
                            <UserX className="h-4 w-4 mr-2" />
                            Excluir Usuário
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create User Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleCreateUser}>
            <DialogHeader>
              <DialogTitle>Novo Usuário</DialogTitle>
              <DialogDescription>
                Cadastre um novo usuário manualmente no sistema.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input 
                    id="name" 
                    placeholder="João Silva" 
                    className="pl-9"
                    value={newUserData.fullName}
                    onChange={(e) => setNewUserData({...newUserData, fullName: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="email@exemplo.com" 
                    className="pl-9"
                    value={newUserData.email}
                    onChange={(e) => setNewUserData({...newUserData, email: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha Inicial</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input 
                    id="password" 
                    type={showCreatePassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    className="pl-9 pr-20"
                    value={newUserData.password}
                    onChange={(e) => setNewUserData({...newUserData, password: e.target.value})}
                    required
                  />
                  <div className="absolute right-3 top-3 flex items-center gap-2">
                    <button 
                      type="button"
                      onClick={handleCopyCreatePassword}
                      className="text-slate-400 hover:text-slate-600 focus:outline-none"
                      title="Copiar senha"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button 
                      type="button"
                      onClick={() => setShowCreatePassword(!showCreatePassword)}
                      className="text-slate-400 hover:text-slate-600 focus:outline-none"
                      title={showCreatePassword ? "Ocultar senha" : "Mostrar senha"}
                    >
                      {showCreatePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Nível de Acesso</Label>
                <Select 
                  value={newUserData.role} 
                  onValueChange={(val) => setNewUserData({...newUserData, role: val})}
                >
                  <SelectTrigger id="role" className="w-full">
                    <SelectValue placeholder="Selecione a permissão" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Usuário Comum</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setIsCreateOpen(false)
                setShowCreatePassword(false)
              }}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createUser.isPending}>
                {createUser.isPending ? 'Criando...' : 'Criar Usuário'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleResetPassword}>
            <DialogHeader>
              <DialogTitle>Redefinir Senha</DialogTitle>
              <DialogDescription>
                Alterar a senha de <strong>{resetTarget?.email}</strong>.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">Nova Senha</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input 
                    id="new-password" 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Mínimo 6 caracteres" 
                    className="pl-9 pr-10"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100">
                Atenção: A alteração é imediata e o usuário não será notificado automaticamente por e-mail neste fluxo administrativo.
              </p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsResetOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="destructive" disabled={resetPassword.isPending}>
                {resetPassword.isPending ? 'Alterando...' : 'Confirmar Alteração'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-rose-600 flex items-center gap-2">
              <UserX className="h-5 w-5" />
              Excluir Usuário
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir permanentemente o usuário <strong>{deleteTarget?.email}</strong>? 
              Esta ação é irreversível e apagará todos os dados associados (planeamentos, receitas, assinaturas e preferências).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => {
              setIsDeleteOpen(false)
              setDeleteTarget(null)
            }}>
              Cancelar
            </Button>
            <Button 
              type="button" 
              variant="destructive" 
              onClick={handleDeleteUser}
              disabled={deleteUser.isPending}
            >
              {deleteUser.isPending ? 'Excluindo...' : 'Confirmar Exclusão'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Plan Dialog */}
      <Dialog open={isPlanOpen} onOpenChange={setIsPlanOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleUpdatePlan}>
            <DialogHeader>
              <DialogTitle>Alterar Plano do Usuário</DialogTitle>
              <DialogDescription>
                Selecione o novo plano para o usuário <strong>{planTarget?.email}</strong>.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="plan-tier">Plano Selecionado</Label>
                <Select 
                  value={selectedPlanTier} 
                  onValueChange={setSelectedPlanTier}
                >
                  <SelectTrigger id="plan-tier" className="w-full">
                    <SelectValue placeholder="Selecione o plano" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Gratuito</SelectItem>
                    <SelectItem value="plano-7-refeicoes">Plano 7 Refeições (Legado)</SelectItem>
                    <SelectItem value="plano-pro-7-dias">Plano PRO 7 Dias</SelectItem>
                    <SelectItem value="plano-14-refeicoes">Plano 14 Refeições (Legado)</SelectItem>
                    <SelectItem value="plano-pro-14-dias">Plano PRO 14 Dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100">
                Nota: Esta alteração atualizará a assinatura ativa do usuário na base de dados imediatamente.
              </p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsPlanOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={updatePlan.isPending}>
                {updatePlan.isPending ? 'Atualizando...' : 'Confirmar Alteração'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
