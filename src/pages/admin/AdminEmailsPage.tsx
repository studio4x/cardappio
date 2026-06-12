import { useState } from 'react'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { 
  useEmailConfig, 
  useUpdateEmailConfig, 
  useEmailLogs,
  useSendTestEmail
} from '@/hooks/admin/useAdminEmails'
import type { EmailLog } from '@/hooks/admin/useAdminEmails'
import { 
  Mail, 
  Settings, 
  History, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  XCircle,
  RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'

export function AdminEmailsPage() {
  const { data: config, isLoading: isConfigLoading, error: configError } = useEmailConfig()
  const updateConfig = useUpdateEmailConfig()
  const { data: logs, isLoading: isLogsLoading, error: logsError, refetch: refetchLogs } = useEmailLogs()

  // State for SMTP Config Form
  const [formData, setFormData] = useState({
    provider: 'smtp',
    smtp_host: '',
    smtp_port: 587,
    smtp_user: '',
    smtp_pass: '',
    from_email: '',
    from_name: 'Cardappio'
  })
  const [showSmtpPass, setShowSmtpPass] = useState(false)
  const [isSavedInit, setIsSavedInit] = useState(false)

  // Sync config data to form state once loaded
  if (config && !isSavedInit) {
    setFormData({
      provider: config.provider || 'smtp',
      smtp_host: config.smtp_host || '',
      smtp_port: config.smtp_port || 587,
      smtp_user: config.smtp_user || '',
      smtp_pass: config.smtp_pass || '',
      from_email: config.from_email || '',
      from_name: config.from_name || 'Cardappio'
    })
    setIsSavedInit(true)
  }

  // State for Log View Modal
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null)
  const [isLogModalOpen, setIsLogModalOpen] = useState(false)

  // State for search logs
  const [searchTerm, setSearchTerm] = useState('')

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await updateConfig.mutateAsync({
        ...formData,
        smtp_port: Number(formData.smtp_port)
      })
      toast.success('Configurações de e-mail SMTP salvas com sucesso!')
    } catch (err: any) {
      toast.error('Erro ao salvar configurações de e-mail.')
    }
  }

  // State & Handler for SMTP Test Email
  const sendTestEmail = useSendTestEmail()
  const [testEmail, setTestEmail] = useState('')

  const handleSendTestEmail = async () => {
    if (!testEmail) return
    try {
      await sendTestEmail.mutateAsync({ toEmail: testEmail })
      toast.success('E-mail de teste enviado com sucesso! Verifique a caixa de entrada.')
      setTestEmail('')
    } catch (err: any) {
      toast.error('Erro ao enviar e-mail de teste', {
        description: err.message || 'Verifique as configurações SMTP salvas e tente novamente.'
      })
    }
  }

  // Filter email logs based on search term
  const filteredLogs = logs?.filter(log => 
    log.to_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.subject.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const isLoading = isConfigLoading || isLogsLoading
  const error = configError || logsError

  if (isLoading) return <LoadingState message="Carregando painel de e-mails..." />
  if (error) return <ErrorState onRetry={() => refetchLogs()} />

  return (
    <div className="space-y-6">
      <PageHeader 
        title="E-mails Transacionais" 
        subtitle="Gerencie configurações do provedor de e-mail SMTP e audite o histórico de e-mails disparados."
      />

      <Tabs defaultValue="logs">
        <TabsList className="mb-4" variant="pill">
          <TabsTrigger value="logs">
            <History className="h-4 w-4 mr-2" />
            Auditoria (Logs)
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Configuração SMTP
          </TabsTrigger>
        </TabsList>

        {/* LOGS AUDITING TAB */}
        <TabsContent value="logs">
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-lg font-bold text-slate-800">Histórico de Disparos</h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const toastId = toast.loading('Atualizando histórico...')
                    try {
                      await refetchLogs()
                      toast.success('Histórico atualizado!', { id: toastId })
                    } catch (e) {
                      toast.error('Erro ao atualizar histórico.', { id: toastId })
                    }
                  }}
                  className="rounded-full flex items-center gap-1.5 text-xs font-semibold h-9"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Atualizar Logs
                </Button>
                <Input
                  placeholder="Pesquisar por destinatário ou assunto..."
                  className="max-w-xs"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="rounded-2xl border bg-white overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b text-xs font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Destinatário</th>
                    <th className="px-6 py-4">Assunto</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Data de Envio</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm">
                  {filteredLogs && filteredLogs.length > 0 ? (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-900">{log.to_email}</td>
                        <td className="px-6 py-4 text-slate-600">{log.subject}</td>
                        <td className="px-6 py-4">
                          {log.status === 'sent' ? (
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1 rounded-full px-3 py-1 font-bold">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Enviado
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 gap-1 rounded-full px-3 py-1 font-bold" title={log.error_message || undefined}>
                              <XCircle className="h-3.5 w-3.5" />
                              Falhou
                            </Badge>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {new Date(log.created_at).toLocaleString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="gap-1.5 rounded-full hover:bg-slate-100 font-bold"
                            onClick={() => {
                              setSelectedLog(log)
                              setIsLogModalOpen(true)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                            Visualizar
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                        Nenhum log de e-mail encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* SMTP SETTINGS TAB */}
        <TabsContent value="settings">
          <div className="max-w-2xl bg-white border rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Servidor de E-mail (SMTP)</h3>
            <p className="text-sm text-slate-500 mb-6">
              A plataforma utiliza autenticação SMTP para disparar e-mails transacionais. Configure as credenciais do seu provedor (como Brevo, Sendgrid ou SMTP próprio) abaixo.
            </p>

            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="smtp_host">Servidor SMTP (Host)</Label>
                  <Input
                    id="smtp_host"
                    placeholder="smtp-relay.brevo.com"
                    value={formData.smtp_host}
                    onChange={(e) => setFormData({ ...formData, smtp_host: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtp_port">Porta</Label>
                  <Input
                    id="smtp_port"
                    type="number"
                    placeholder="587"
                    value={formData.smtp_port}
                    onChange={(e) => setFormData({ ...formData, smtp_port: parseInt(e.target.value) || 587 })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="smtp_user">Usuário SMTP</Label>
                <Input
                  id="smtp_user"
                  placeholder="exemplo@provedor.com ou login-chave"
                  value={formData.smtp_user}
                  onChange={(e) => setFormData({ ...formData, smtp_user: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="smtp_pass">Senha SMTP</Label>
                <div className="relative">
                  <Input
                    id="smtp_pass"
                    type={showSmtpPass ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    value={formData.smtp_pass}
                    onChange={(e) => setFormData({ ...formData, smtp_pass: e.target.value })}
                    required
                    className="pr-10 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSmtpPass(!showSmtpPass)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showSmtpPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="from_email">E-mail do Remetente (From)</Label>
                  <Input
                    id="from_email"
                    type="email"
                    placeholder="contato@studio4x.com.br"
                    value={formData.from_email}
                    onChange={(e) => setFormData({ ...formData, from_email: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="from_name">Nome do Remetente</Label>
                  <Input
                    id="from_name"
                    placeholder="Cardappio"
                    value={formData.from_name}
                    onChange={(e) => setFormData({ ...formData, from_name: e.target.value })}
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center gap-4">
                <Button type="submit" disabled={updateConfig.isPending} className="px-6 rounded-full font-bold">
                  {updateConfig.isPending ? 'Salvando...' : 'Salvar Configurações'}
                </Button>
              </div>
            </form>

            {/* Test Email Form */}
            <div className="mt-8 pt-8 border-t border-slate-100 space-y-4">
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Mail className="h-4.5 w-4.5 text-primary" />
                Enviar E-mail de Teste
              </h4>
              <p className="text-xs text-slate-500">
                Teste as configurações SMTP salvas enviando um e-mail de teste para o endereço informado.
              </p>
              
              <div className="flex gap-2 max-w-md">
                <Input
                  type="email"
                  placeholder="destinatario@exemplo.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="rounded-xl"
                />
                <Button 
                  onClick={handleSendTestEmail} 
                  disabled={sendTestEmail.isPending || !testEmail}
                  variant="outline"
                  className="rounded-full shrink-0 font-semibold"
                >
                  {sendTestEmail.isPending ? 'Enviando...' : 'Enviar Teste'}
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Audit Log HTML Preview Dialog */}
      <Dialog open={isLogModalOpen} onOpenChange={setIsLogModalOpen}>
        <DialogContent className="sm:max-w-2xl h-[85vh] flex flex-col">
          <DialogHeader className="border-b pb-3 shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-slate-600" />
              Auditoria de E-mail
            </DialogTitle>
            <DialogDescription>
              Visualizando e-mail disparado para <strong>{selectedLog?.to_email}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 bg-slate-50 rounded-xl overflow-hidden border flex flex-col min-h-0 my-3">
            <div className="bg-white p-4 border-b space-y-1.5 text-xs text-slate-600">
              <div><strong>Destinatário:</strong> {selectedLog?.to_email}</div>
              <div><strong>Assunto:</strong> {selectedLog?.subject}</div>
              <div><strong>Disparado em:</strong> {selectedLog && new Date(selectedLog.created_at).toLocaleString('pt-BR')}</div>
              {selectedLog?.status === 'failed' && (
                <div className="text-rose-600 font-bold bg-rose-50 p-2.5 rounded border border-rose-100 flex items-start gap-1.5 mt-2">
                  <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div><strong>Erro do Provedor:</strong> {selectedLog.error_message || 'Erro desconhecido.'}</div>
                </div>
              )}
            </div>
            <div className="flex-1 min-h-0">
              {selectedLog?.body_html && (
                <iframe
                  title="Sent Email Content Preview"
                  className="w-full h-full border-0 bg-white"
                  srcDoc={selectedLog.body_html}
                />
              )}
            </div>
          </div>

          <DialogFooter className="shrink-0">
            <Button type="button" variant="outline" onClick={() => {
              setIsLogModalOpen(false)
              setSelectedLog(null)
            }}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
