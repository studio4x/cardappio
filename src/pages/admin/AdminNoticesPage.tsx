import { useAdminNotices } from '@/hooks/admin/useAdminEditorial'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingState } from '@/components/shared/LoadingState'
import { Button } from '@/components/ui/button'
import { Plus, Bell, Info, TriangleAlert, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

export function AdminNoticesPage() {
  const { data: notices, isLoading, saveMutation, toggleStatusMutation } = useAdminNotices()

  if (isLoading) return <LoadingState />

  const handleAdd = () => {
    const title = prompt('Título da Dica/Aviso:')
    if (title) {
      const body = prompt('Conteúdo:')
      const type = prompt('Tipo (tip, alert, seasonal):', 'tip')
      saveMutation.mutate({ title, body, notice_type: type, is_active: true })
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'alert': return <TriangleAlert className="h-4 w-4" />
      case 'tip': return <Info className="h-4 w-4" />
      default: return <Bell className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Dicas e Alertas" 
        subtitle="Gerencie mensagens curtas que aparecem no dashboard do usuário."
        actions={
          <Button onClick={handleAdd} className="rounded-full px-6 bg-slate-900 shadow-sm">
            <Plus className="h-4 w-4 mr-2" />
            Novo Aviso
          </Button>
        }
      />

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="grid grid-cols-1 divide-y divide-slate-100">
          {notices?.map((notice) => (
            <div key={notice.id} className="flex items-start gap-5 p-6 hover:bg-slate-50/50 transition-colors">
              <div className={cn(
                "mt-1 p-2 rounded-xl",
                notice.notice_type === 'alert' ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"
              )}>
                {getIcon(notice.notice_type)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h4 className="font-bold text-slate-900">{notice.title}</h4>
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                    notice.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"
                  )}>
                    {notice.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed max-w-2xl">{notice.body}</p>
                <p className="text-[10px] text-slate-300 mt-3 uppercase font-bold tracking-tighter">
                  Criado em {new Date(notice.created_at).toLocaleDateString()}
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => toggleStatusMutation.mutate({ id: notice.id, is_active: !notice.is_active })}
                className="rounded-full flex items-center gap-2 font-bold text-xs"
              >
                {notice.is_active ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                {notice.is_active ? 'Desativar' : 'Ativar'}
              </Button>
            </div>
          ))}
          {notices?.length === 0 && (
            <div className="p-12 text-center text-slate-400 italic">
              Nenhuma dica ativa cadastrada.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
