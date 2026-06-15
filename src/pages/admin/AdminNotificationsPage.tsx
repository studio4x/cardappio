import { useState } from 'react'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { useAdminUsers } from '@/hooks/admin/useAdminUsers'
import { 
  useAdminNotificationQueue, 
  useAdminDeliveryLogs, 
  useAdminCronLogs, 
  useSendManualNotification, 
  useTriggerNotificationDispatch, 
  useCancelQueueItem 
} from '@/hooks/admin/useAdminNotifications'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  Send, 
  RefreshCw, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Activity, 
  Bell, 
  User, 
  AlertTriangle,
  History,
  FileText,
  Image as ImageIcon,
  Copy
} from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'

export function AdminNotificationsPage() {
  const { data: users } = useAdminUsers()
  const { data: queue, isLoading: isQueueLoading, error: queueError, refetch: refetchQueue } = useAdminNotificationQueue()
  const { data: logs, isLoading: isLogsLoading, error: logsError, refetch: refetchLogs } = useAdminDeliveryLogs()
  const { data: cronLogs, isLoading: isCronLoading, error: cronError, refetch: refetchCron } = useAdminCronLogs()

  const sendNotification = useSendManualNotification()
  const triggerDispatch = useTriggerNotificationDispatch()
  const cancelQueue = useCancelQueueItem()

  // Form State
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [type, setType] = useState('system')
  const [target, setTarget] = useState<'all' | 'subscribers' | 'specific'>('all')
  const [specificUserId, setSpecificUserId] = useState('')
  const [actionUrl, setActionUrl] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 2MB')
      return
    }

    try {
      setIsUploading(true)
      const fileExt = file.name.split('.').pop()
      const fileName = `notification-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `notifications/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('system')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('system')
        .getPublicUrl(filePath)

      setImageUrl(publicUrl)
      toast.success('Imagem enviada com sucesso!')
    } catch (err: any) {
      console.error('Error uploading image:', err)
      toast.error(err.message || 'Erro ao enviar imagem')
    } finally {
      setIsUploading(false)
    }
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !body) {
      toast.error('Preencha o título e a mensagem')
      return
    }

    try {
      const result = await sendNotification.mutateAsync({
        title,
        body,
        type,
        target,
        specificUserId: target === 'specific' ? specificUserId : undefined,
        actionUrl: actionUrl || undefined,
        imageUrl: imageUrl || undefined
      })

      toast.success(`Notificação enfileirada e disparada para ${result.count} usuários!`)
      setTitle('')
      setBody('')
      setActionUrl('')
      setImageUrl('')
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar notificação')
    }
  }

  const handleManualDispatch = async () => {
    try {
      const result = await triggerDispatch.mutateAsync()
      toast.success(`Disparador processado: ${result.succeeded} enviadas com sucesso, ${result.failed} falhas.`)
    } catch (err: any) {
      toast.error(err.message || 'Erro ao forçar processamento da fila')
    }
  }

  const handleCancel = async (id: string) => {
    try {
      await cancelQueue.mutateAsync(id)
      toast.success('Notificação removida da fila')
    } catch (err) {
      toast.error('Erro ao remover notificação')
    }
  }

  const handleCopyNotification = (item: any) => {
    setTitle(item.title)
    setBody(item.body)
    setType(item.type)
    setActionUrl(item.payload_json?.action_url || '')
    setImageUrl(item.payload_json?.image_url || '')
    toast.success('Conteúdo copiado para o formulário!')
  }

  const handleResend = async (item: any) => {
    const targetText = target === 'all' ? 'todos os usuários' : target === 'subscribers' ? 'apenas assinantes' : 'usuário específico';
    if (!confirm(`Deseja reenviar esta notificação agora para ${targetText}?`)) {
      return
    }

    try {
      const result = await sendNotification.mutateAsync({
        title: item.title,
        body: item.body,
        type: item.type,
        target,
        specificUserId: target === 'specific' ? specificUserId : undefined,
        actionUrl: item.payload_json?.action_url || undefined,
        imageUrl: item.payload_json?.image_url || undefined
      })

      toast.success(`Notificação reenviada para ${result.count} usuários!`)
    } catch (err: any) {
      toast.error(err.message || 'Erro ao reenviar notificação')
    }
  }

  // Get 5 most recent unique sent notifications for quick copy/resend
  const uniqueRecentNotifications = queue
    ? Array.from(
        new Map(
          queue
            .filter(item => item.status === 'sent')
            .map(item => [`${item.title}-${item.body}`, item])
        ).values()
      ).slice(0, 5)
    : [];

  // Calculate metrics
  const totalQueued = queue?.length || 0
  const pendingCount = queue?.filter(q => q.status === 'pending').length || 0
  const failedCount = queue?.filter(q => q.status === 'failed').length || 0
  const sentCount = queue?.filter(q => q.status === 'sent').length || 0

  if (isQueueLoading || isLogsLoading || isCronLoading) {
    return <LoadingState message="Carregando central de notificações..." />
  }

  if (queueError || logsError || cronError) {
    return (
      <ErrorState 
        onRetry={() => {
          refetchQueue()
          refetchLogs()
          refetchCron()
        }} 
      />
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader 
          title="Notificações & Push" 
          subtitle="Envio manual de mensagens push e rastreamento de entregas transacionais da plataforma."
        />
        <Button onClick={handleManualDispatch} variant="outline" className="gap-2 self-start sm:self-auto border-dashed hover:border-solid">
          <RefreshCw className={`h-4 w-4 ${triggerDispatch.isPending ? 'animate-spin' : ''}`} />
          Forçar Processamento da Fila
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border bg-white p-6 shadow-sm flex items-center gap-4">
          <div className="rounded-full bg-slate-100 p-3 text-slate-600">
            <Bell className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Enfileiradas (Total)</p>
            <p className="text-2xl font-bold text-slate-900">{totalQueued}</p>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm flex items-center gap-4">
          <div className="rounded-full bg-blue-50 p-3 text-blue-600">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Pendentes de Envio</p>
            <p className="text-2xl font-bold text-blue-600">{pendingCount}</p>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm flex items-center gap-4">
          <div className="rounded-full bg-emerald-50 p-3 text-emerald-600">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Enviadas com Sucesso</p>
            <p className="text-2xl font-bold text-emerald-600">{sentCount}</p>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm flex items-center gap-4">
          <div className="rounded-full bg-rose-50 p-3 text-rose-600">
            <XCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Falhas de Entrega</p>
            <p className="text-2xl font-bold text-rose-600">{failedCount}</p>
          </div>
        </div>
      </div>

      {/* Tabs Control */}
      <Tabs defaultValue="send" className="w-full">
        <TabsList variant="pill" className="mb-6">
          <TabsTrigger value="send">
            <Send className="h-4 w-4" />
            Enviar Notificação
          </TabsTrigger>
          <TabsTrigger value="queue">
            <History className="h-4 w-4" />
            Fila de Disparos
          </TabsTrigger>
          <TabsTrigger value="logs">
            <FileText className="h-4 w-4" />
            Logs de Entrega (Push)
          </TabsTrigger>
          <TabsTrigger value="automation">
            <Activity className="h-4 w-4" />
            Histórico de Cron/Automações
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Enviar Notificação */}
        <TabsContent value="send" className="space-y-6 outline-none">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2 rounded-2xl border bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Bell className="h-5 w-5 text-indigo-500" />
                Nova Notificação Manual
              </h3>

              <form onSubmit={handleSend} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo da Notificação</Label>
                    <Select value={type} onValueChange={setType}>
                      <SelectTrigger id="type">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="system">Sistema (Atualizações)</SelectItem>
                        <SelectItem value="promotion">Promoção (Novidades)</SelectItem>
                        <SelectItem value="meal_reminder">Lembrete de Preparo</SelectItem>
                        <SelectItem value="subscription">Assinatura / Cobrança</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="target">Público Destinatário</Label>
                    <Select value={target} onValueChange={(val: any) => setTarget(val)}>
                      <SelectTrigger id="target">
                        <SelectValue placeholder="Selecione o público" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os Usuários Comuns</SelectItem>
                        <SelectItem value="subscribers">Apenas Assinantes Ativos (Premium/Gold)</SelectItem>
                        <SelectItem value="specific">Usuário Específico</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {target === 'specific' && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                    <Label htmlFor="user">Selecionar Usuário</Label>
                    <Select value={specificUserId} onValueChange={setSpecificUserId}>
                      <SelectTrigger id="user">
                        <SelectValue placeholder="Selecione o destinatário" />
                      </SelectTrigger>
                      <SelectContent>
                        {users?.filter(u => u.role === 'user').map(u => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.full_name || 'Sem Nome'} ({u.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="title">Título da Notificação</Label>
                  <Input 
                    id="title" 
                    placeholder="Ex: 🍳 Hora de descongelar o frango para amanhã!" 
                    value={title} 
                    onChange={e => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="body">Mensagem (Corpo da Notificação)</Label>
                  <textarea 
                    id="body" 
                    rows={4}
                    placeholder="Escreva a mensagem curta que aparecerá na tela do celular do usuário..." 
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={body} 
                    onChange={e => setBody(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="actionUrl">Link de Ação (URL Relativa - Opcional)</Label>
                  <Input 
                    id="actionUrl" 
                    placeholder="Ex: /app/receitas ou /app/semana" 
                    value={actionUrl} 
                    onChange={e => setActionUrl(e.target.value)}
                  />
                  <p className="text-xs text-slate-400">Quando o usuário clicar na notificação push ou in-app, ele será redirecionado para este link na plataforma.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="imageUrl">Imagem da Notificação (URL ou Upload)</Label>
                  <div className="flex gap-4 items-center">
                    <Input 
                      id="imageUrl" 
                      placeholder="https://exemplo.com/imagem.png ou use o botão de upload ao lado" 
                      value={imageUrl} 
                      onChange={e => setImageUrl(e.target.value)}
                      className="flex-1"
                    />
                    <div className="relative">
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="gap-2 cursor-pointer relative"
                        disabled={isUploading}
                        asChild
                      >
                        <label className="cursor-pointer">
                          {isUploading ? 'Enviando...' : 'Upload'}
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*" 
                            onChange={handleImageUpload} 
                            disabled={isUploading}
                          />
                        </label>
                      </Button>
                    </div>
                  </div>
                  
                  {imageUrl && (
                    <div className="relative w-full max-w-xs aspect-video mt-2 rounded-lg border overflow-hidden bg-slate-50 group">
                      <img src={imageUrl} className="w-full h-full object-cover" alt="Preview da notificação" />
                      <button
                        type="button"
                        onClick={() => setImageUrl('')}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors opacity-0 group-hover:opacity-100"
                        title="Remover Imagem"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  
                  <div className="text-xs text-slate-400 space-y-1 mt-1">
                    <p>💡 <strong>Recomendações para Imagens Push:</strong></p>
                    <ul className="list-disc pl-4 space-y-0.5">
                      <li><strong>Proporção ideal:</strong> 16:9 (ex: 1920x1080px ou 720x400px) para imagem principal do corpo.</li>
                      <li><strong>Tamanho do arquivo:</strong> Máximo de 2MB para evitar atrasos na entrega ou rejeições.</li>
                      <li><strong>Compatibilidade:</strong> Imagens grandes são suportadas no Android (Chrome) e Windows/macOS (Chrome/Edge/Firefox). No iOS (Safari), o suporte de imagens em push depende da versão do sistema.</li>
                    </ul>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button type="submit" className="gap-2 px-8" disabled={sendNotification.isPending}>
                    <Send className="h-4 w-4" />
                    {sendNotification.isPending ? 'Enviando...' : 'Enviar Agora'}
                  </Button>
                </div>
              </form>
            </div>

            {/* Sidebar info */}
            <div className="space-y-6">
              {/* Card 1: 5 últimas notificações enviadas */}
              <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <History className="h-4 w-4 text-indigo-500" />
                  Últimas Enviadas
                </h3>
                
                {uniqueRecentNotifications.length > 0 ? (
                  <div className="space-y-4">
                    {uniqueRecentNotifications.map((item: any) => (
                      <div key={item.id} className="text-xs border-b last:border-0 pb-3 last:pb-0 border-slate-100 flex flex-col gap-1.5">
                        <div className="flex justify-between items-start gap-2">
                          <span className="font-bold text-slate-800 line-clamp-1">{item.title}</span>
                          <Badge variant="outline" className="text-[10px] scale-90 origin-right whitespace-nowrap capitalize">
                            {item.type === 'meal_reminder' ? 'Lembrete' : item.type}
                          </Badge>
                        </div>
                        <p className="text-slate-500 line-clamp-2 leading-relaxed">{item.body}</p>
                        
                        {item.payload_json?.image_url && (
                          <div className="relative w-16 aspect-video rounded border overflow-hidden bg-slate-50">
                            <img src={item.payload_json.image_url} className="w-full h-full object-cover" />
                          </div>
                        )}
                        
                        <div className="flex gap-2 mt-1">
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 text-[11px] px-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 gap-1 cursor-pointer"
                            onClick={() => handleCopyNotification(item)}
                          >
                            <Copy className="h-3 w-3" />
                            Aproveitar
                          </Button>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 text-[11px] px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 gap-1 cursor-pointer"
                            onClick={() => handleResend(item)}
                            disabled={sendNotification.isPending}
                          >
                            <Send className="h-3 w-3" />
                            Reenviar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 text-center py-4">Nenhuma notificação enviada recentemente.</p>
                )}
              </div>

              {/* Card 2: Como funciona o push */}
              <div className="rounded-2xl border bg-slate-50 p-6 shadow-sm flex flex-col justify-between">
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-900">Como funciona o push?</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    As notificações utilizam o padrão <strong>Web Push (VAPID)</strong> diretamente no navegador ou PWA instalado do usuário.
                  </p>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Quando você clica em <strong>"Enviar Agora"</strong>:
                  </p>
                  <ol className="list-decimal pl-5 text-xs text-slate-500 space-y-2">
                    <li>O sistema cria e adiciona a fila como <code>pending</code>.</li>
                    <li>Invoca instantaneamente a Edge Function de disparo.</li>
                    <li>A função envia o alerta in-app e despacha o pacote push via protocolo de rede.</li>
                    <li>Os logs de entrega são criados imediatamente para você auditar a entrega.</li>
                  </ol>
                </div>

                <div className="mt-6 border-t pt-4 border-slate-200">
                  <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                    <span>Apenas usuários que concederam permissão de notificações em seus navegadores receberão o push.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Fila de Disparos */}
        <TabsContent value="queue" className="outline-none">
          <div className="rounded-2xl border bg-white overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">Mensagens Recentes na Fila</h3>
              <Button onClick={() => refetchQueue()} variant="ghost" size="icon" className="rounded-full">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b text-xs font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Destinatário</th>
                    <th className="px-6 py-4">Título</th>
                    <th className="px-6 py-4">Tipo</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-center">Tentativas</th>
                    <th className="px-6 py-4">Criação / Erro</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm">
                  {queue && queue.length > 0 ? (
                    queue.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900">{item.profile?.full_name || 'Sem nome'}</span>
                            <span className="text-xs text-slate-500">{item.profile?.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 max-w-xs truncate">
                          <span className="font-medium block text-slate-800" title={item.body}>{item.title}</span>
                          <span className="text-xs text-slate-400 block truncate">{item.body}</span>
                        </td>
                        <td className="px-6 py-4 capitalize text-slate-600">
                          {item.type === 'meal_reminder' ? 'Lembrete' : item.type}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={
                            item.status === 'sent' ? 'secondary' :
                            item.status === 'failed' ? 'destructive' :
                            item.status === 'processing' ? 'outline' : 'default'
                          } className={
                            item.status === 'sent' ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-50' :
                            item.status === 'processing' ? 'bg-amber-50 text-amber-700 hover:bg-amber-50 border-amber-200' : ''
                          }>
                            {item.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-center text-slate-500">{item.attempts}</td>
                        <td className="px-6 py-4 text-xs">
                          {item.last_error ? (
                            <span className="text-rose-600 font-medium block max-w-xs truncate" title={item.last_error}>
                              ⚠️ {item.last_error}
                            </span>
                          ) : (
                            <span className="text-slate-500">
                              {new Date(item.created_at).toLocaleString()}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {item.status === 'pending' && (
                            <Button 
                              onClick={() => handleCancel(item.id)}
                              variant="ghost" 
                              size="icon" 
                              className="rounded-full text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                              title="Cancelar Notificação"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                        Nenhuma notificação na fila recentemente.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* Tab 3: Logs de Entrega */}
        <TabsContent value="logs" className="outline-none">
          <div className="rounded-2xl border bg-white overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">Logs Detalhados de Entrega (Push & In-App)</h3>
              <Button onClick={() => refetchLogs()} variant="ghost" size="icon" className="rounded-full">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b text-xs font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Usuário</th>
                    <th className="px-6 py-4">Canal</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Erro de Transmissão</th>
                    <th className="px-6 py-4">Entregue Em</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm">
                  {logs && logs.length > 0 ? (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900">{log.profile?.full_name || 'Sem nome'}</span>
                            <span className="text-xs text-slate-500">{log.profile?.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className={`capitalize ${
                            log.channel === 'push' ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-slate-50 text-slate-700'
                          }`}>
                            {log.channel === 'push' ? 'Browser Push' : 'Central In-App'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 text-xs font-bold uppercase ${
                            log.status === 'success' ? 'text-emerald-600' : 'text-rose-600'
                          }`}>
                            {log.status === 'success' ? (
                              <>
                                <CheckCircle2 className="h-3 w-3" /> Sucesso
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3 w-3" /> Falha
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs font-mono text-rose-600 max-w-sm truncate" title={log.error_message || ''}>
                          {log.error_message || <span className="text-slate-400 font-sans">-</span>}
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {new Date(log.delivered_at).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                        Nenhum log de entrega gravado no banco de dados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* Tab 4: Logs de Automação */}
        <TabsContent value="automation" className="outline-none">
          <div className="rounded-2xl border bg-white overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">Histórico de Disparadores Automáticos (Jobs / Cron)</h3>
              <Button onClick={() => refetchCron()} variant="ghost" size="icon" className="rounded-full">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b text-xs font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Serviço / Job</th>
                    <th className="px-6 py-4">Status de Execução</th>
                    <th className="px-6 py-4 text-center">Processados</th>
                    <th className="px-6 py-4">Detalhes Técnicos (JSON)</th>
                    <th className="px-6 py-4">Executado Em</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm">
                  {cronLogs && cronLogs.length > 0 ? (
                    cronLogs.map((cLog) => (
                      <tr key={cLog.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-slate-700">
                          {cLog.job_name}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            cLog.status === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {cLog.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-slate-900">
                          {cLog.processed_count}
                        </td>
                        <td className="px-6 py-4 text-xs font-mono text-slate-500 max-w-sm truncate" title={JSON.stringify(cLog.metadata_json, null, 2)}>
                          {JSON.stringify(cLog.metadata_json)}
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {new Date(cLog.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                        Nenhum registro de execução de cron encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
