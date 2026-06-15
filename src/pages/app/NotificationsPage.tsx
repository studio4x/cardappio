import { Bell, Check, Trash2, Calendar, CreditCard, Sparkles } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingState } from '@/components/shared/LoadingState'
import { EmptyState } from '@/components/shared/EmptyState'
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from '@/hooks/notifications/useNotifications'
import { Button } from '@/components/ui/button'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'

export function NotificationsPage() {
  const { data: notifications, isLoading, refetch } = useNotifications()
  const markAsRead = useMarkAsRead()
  const markAllAsRead = useMarkAllAsRead()
  const navigate = useNavigate()

  const unreadCount = notifications?.filter(n => !n.is_read).length || 0

  if (isLoading) return <LoadingState message="Buscando notificações..." />

  const getIcon = (type: string) => {
    switch (type) {
      case 'meal_reminder': return <Calendar className="h-4 w-4" />
      case 'subscription': return <CreditCard className="h-4 w-4" />
      case 'promotion': return <Sparkles className="h-4 w-4" />
      default: return <Bell className="h-4 w-4" />
    }
  }

  const getColor = (type: string) => {
    switch (type) {
      case 'meal_reminder': return 'bg-blue-100 text-blue-600'
      case 'subscription': return 'bg-amber-100 text-amber-600'
      case 'promotion': return 'bg-purple-100 text-purple-600'
      default: return 'bg-slate-100 text-slate-600'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader 
          title="Notificações" 
          subtitle={`Você tem ${unreadCount} mensagens não lidas.`}
        />
        {unreadCount > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => markAllAsRead.mutate()}
            className="text-xs font-bold text-primary hover:text-primary/80"
          >
            Ler todas
          </Button>
        )}
      </div>

      {!notifications || notifications.length === 0 ? (
        <EmptyState 
          icon={<Bell className="h-8 w-8 text-muted-foreground" />}
          title="Tudo limpo por aqui"
          description="Você não tem nenhuma notificação no momento."
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => !notif.is_read && markAsRead.mutate(notif.id)}
              className={cn(
                "group relative overflow-hidden rounded-2xl border bg-white p-5 transition-all hover:shadow-md cursor-pointer flex flex-col gap-4",
                notif.is_read ? "opacity-80 border-slate-100 bg-white/60" : "border-slate-200 shadow-sm"
              )}
            >
              {/* Badge/Dot and Date */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {!notif.is_read && (
                    <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  )}
                  <div className={cn("flex h-8 w-8 items-center justify-center rounded-full", getColor(notif.type))}>
                    {getIcon(notif.type)}
                  </div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {notif.type === 'meal_reminder' ? 'Lembrete' : notif.type === 'subscription' ? 'Assinatura' : notif.type === 'promotion' ? 'Novidade' : 'Sistema'}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">
                  {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: ptBR })}
                </span>
              </div>

              {/* Main Content (Title, Body, Image) */}
              <div className="space-y-3">
                <h4 className="text-base font-bold text-slate-900">
                  {notif.title}
                </h4>
                <p className="text-sm leading-relaxed text-slate-600">
                  {notif.body}
                </p>

                {notif.image_url && (
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-50 border border-slate-100">
                    <img src={notif.image_url} className="w-full h-full object-cover" alt="Imagem da notificação" />
                  </div>
                )}
              </div>

              {/* Action Button & Mark as Read */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-slate-100">
                {notif.action_url ? (
                  <Button 
                    variant="default"
                    size="sm"
                    className="w-full sm:w-auto font-bold gap-2 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!notif.is_read) markAsRead.mutate(notif.id);
                      if (notif.action_url?.startsWith('http')) {
                        window.open(notif.action_url, '_blank');
                      } else {
                        navigate(notif.action_url || '/');
                      }
                    }}
                  >
                    Abrir Link
                  </Button>
                ) : (
                  <div />
                )}

                {!notif.is_read ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full sm:w-auto text-xs font-semibold text-slate-500 hover:text-primary gap-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsRead.mutate(notif.id);
                    }}
                  >
                    <Check className="h-3.5 w-3.5" />
                    Marcar como lida
                  </Button>
                ) : (
                  <span className="text-xs text-slate-400 italic font-medium">Lida</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
