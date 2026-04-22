import { Bell, Check, Trash2, Calendar, CreditCard, Sparkles } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingState } from '@/components/shared/LoadingState'
import { EmptyState } from '@/components/shared/EmptyState'
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from '@/hooks/notifications/useNotifications'
import { Button } from '@/components/ui/button'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

export function NotificationsPage() {
  const { data: notifications, isLoading, refetch } = useNotifications()
  const markAsRead = useMarkAsRead()
  const markAllAsRead = useMarkAllAsRead()

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
        <div className="space-y-3">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => !notif.is_read && markAsRead.mutate(notif.id)}
              className={cn(
                "group relative flex gap-4 rounded-2xl border p-4 transition-all hover:shadow-sm cursor-pointer",
                notif.is_read ? "bg-white/50 border-transparent opacity-80" : "bg-white border-outline-variant shadow-sm"
              )}
              style={{ borderColor: notif.is_read ? 'transparent' : 'var(--color-outline-variant)' }}
            >
              <div className={cn("mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full", getColor(notif.type))}>
                {getIcon(notif.type)}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className={cn("text-sm font-bold", !notif.is_read ? "text-foreground" : "text-muted-foreground")}>
                    {notif.title}
                  </h4>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: ptBR })}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {notif.body}
                </p>
              </div>
              {!notif.is_read && (
                <div className="absolute right-4 bottom-4 h-2 w-2 rounded-full bg-primary" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
