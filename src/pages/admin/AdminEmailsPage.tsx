import { useState } from 'react'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
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
import type { EmailLog, EmailProvider } from '@/hooks/admin/useAdminEmails'
import { 
  Mail, 
  Settings, 
  History, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  XCircle,
  RefreshCw,
  Key,
  Zap,
  Server,
  ExternalLink,
  Info,
} from 'lucide-react'
import { toast } from 'sonner'

export function AdminEmailsPage() {
  const { data: config, isLoading: isConfigLoading, error: configError } = useEmailConfig()
  const updateConfig = useUpdateEmailConfig()
  const { data: logs, isLoading: isLogsLoading, error: logsError, refetch: refetchLogs } = useEmailLogs()

  // State for Config Form
  const [formData, setFormData] = useState({
    provider: 'smtp' as EmailProvider,
    brevo_api_key: '',
    smtp_host: '',
    smtp_port: 587,
    smtp_user: '',
    smtp_pass: '',
    from_email: '',
    from_name: 'Cardappio'
  })
  const [showSmtpPass, setShowSmtpPass] = useState(false)
  const [showBrevoKey, setShowBrevoKey] = useState(false)
  const [isSavedInit, setIsSavedInit] = useState(false)

  // Sync config data to form state once loaded
  if (config && !isSavedInit) {
    setFormData({
      provider: config.provider || 'smtp',
      brevo_api_key: config.brevo_api_key || '',
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

  const isBrevo = formData.provider === 'brevo'

  const handleProviderToggle = (checked: boolean) => {
    setFormData(prev => ({ ...prev, provider: checked ? 'brevo' : 'smtp' }))
  }

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await updateConfig.mutateAsync({
        ...formData,
        smtp_port: Number(formData.smtp_port)
      })
      toast.success(
        isBrevo
          ? 'Configuração Brevo API salva com sucesso!'
          : 'Configurações de e-mail SMTP salvas com sucesso!'
      )
    } catch (err: any) {
      toast.error('Erro ao salvar configurações de e-mail.')
    }
  }

  // State & Handler for Test Email
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
        description: err.message || 'Verifique as configurações salvas e tente novamente.'
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
        subtitle="Gerencie o provedor de e-mail e audite o histórico de disparos da plataforma."
      />

      <Tabs defaultValue="logs">
        <TabsList className="mb-4" variant="pill">
          <TabsTrigger value="logs">
            <History className="h-4 w-4 mr-2" />
            Auditoria (Logs)
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Provedor de E-mail
          </TabsTrigger>
        </TabsList>

        {/* ─── LOGS AUDITING TAB ──────────────────────────────────────────── */}
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
                    <th className="px-6 py-4">Provedor</th>
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
                          {log.provider === 'brevo' ? (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1 rounded-full px-3 py-1 font-bold">
                              <Zap className="h-3 w-3" />
                              Brevo
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200 gap-1 rounded-full px-3 py-1 font-bold">
                              <Server className="h-3 w-3" />
                              SMTP
                            </Badge>
                          )}
                        </td>
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
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                        Nenhum log de e-mail encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* ─── PROVIDER SETTINGS TAB ─────────────────────────────────────── */}
        <TabsContent value="settings">
          <div className="max-w-2xl space-y-6">

            {/* Provider Toggle Card */}
            <div className="bg-white border rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-1">Provedor de Envio</h3>
              <p className="text-sm text-slate-500 mb-6">
                Escolha como a plataforma enviará e-mails transacionais. O Brevo API oferece maior rastreabilidade e entregabilidade.
              </p>

              {/* Toggle SMTP ↔ Brevo */}
              <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50">
                {/* SMTP label */}
                <div className={`flex items-center gap-2 transition-opacity ${isBrevo ? 'opacity-40' : 'opacity-100'}`}>
                  <Server className="h-4 w-4 text-slate-500" />
                  <span className="text-sm font-semibold text-slate-700">SMTP</span>
                </div>

                <Switch
                  id="provider-toggle"
                  checked={isBrevo}
                  onCheckedChange={handleProviderToggle}
                  className="data-[state=checked]:bg-blue-600"
                />

                {/* Brevo label */}
                <div className={`flex items-center gap-2 transition-opacity ${isBrevo ? 'opacity-100' : 'opacity-40'}`}>
                  <Zap className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-700">Brevo API</span>
                  {isBrevo && (
                    <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-[10px] font-bold rounded-full px-2">
                      ATIVO
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Config Form Card */}
            <div className="bg-white border rounded-2xl p-6 shadow-sm">
              <form onSubmit={handleSaveConfig} className="space-y-5">

                {/* ── Brevo Section ── */}
                {isBrevo && (
                  <div className="space-y-5">
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100">
                      <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                      <div className="text-sm text-blue-700 leading-relaxed">
                        <p className="font-semibold mb-1">Como obter sua API key Brevo</p>
                        <p className="text-blue-600 text-xs">
                          Acesse <strong>Brevo → Configurações → Chaves de API</strong> e crie ou copie sua chave. 
                          A chave começa com <code className="bg-blue-100 px-1 rounded font-mono">xkeysib-</code>.
                        </p>
                        <a 
                          href="https://app.brevo.com/settings/keys/api" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-blue-700 hover:text-blue-900 underline underline-offset-2"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Abrir painel de API Keys da Brevo
                        </a>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="brevo_api_key" className="flex items-center gap-1.5">
                        <Key className="h-3.5 w-3.5 text-blue-600" />
                        Chave de API Brevo
                      </Label>
                      <div className="relative">
                        <Input
                          id="brevo_api_key"
                          type={showBrevoKey ? 'text' : 'password'}
                          placeholder="xkeysib-••••••••••••••••••••••••••••••••••••••••••••••••••••••••"
                          value={formData.brevo_api_key}
                          onChange={(e) => setFormData({ ...formData, brevo_api_key: e.target.value })}
                          required={isBrevo}
                          className="pr-10 font-mono text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowBrevoKey(!showBrevoKey)}
                          className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                        >
                          {showBrevoKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <p className="text-xs text-slate-500">
                        A chave é armazenada de forma segura no banco de dados e nunca exposta ao cliente.
                      </p>
                    </div>
                  </div>
                )}

                {/* ── SMTP Section ── */}
                {!isBrevo && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2 space-y-2">
                        <Label htmlFor="smtp_host">Servidor SMTP (Host)</Label>
                        <Input
                          id="smtp_host"
                          placeholder="smtp-relay.brevo.com"
                          value={formData.smtp_host}
                          onChange={(e) => setFormData({ ...formData, smtp_host: e.target.value })}
                          required={!isBrevo}
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
                          required={!isBrevo}
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
                        required={!isBrevo}
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
                          required={!isBrevo}
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
                  </div>
                )}

                {/* ── From fields (shared) ── */}
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                    Identidade do Remetente
                  </p>
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
                </div>

                <div className="pt-2 flex items-center gap-4">
                  <Button type="submit" disabled={updateConfig.isPending} className="px-6 rounded-full font-bold">
                    {updateConfig.isPending ? 'Salvando...' : 'Salvar Configurações'}
                  </Button>
                  {config?.provider && (
                    <span className="text-xs text-slate-400 flex items-center gap-1.5">
                      {config.provider === 'brevo' ? (
                        <><Zap className="h-3 w-3 text-blue-500" /> Provedor salvo: <strong className="text-blue-600">Brevo API</strong></>
                      ) : (
                        <><Server className="h-3 w-3 text-slate-400" /> Provedor salvo: <strong className="text-slate-600">SMTP</strong></>
                      )}
                    </span>
                  )}
                </div>
              </form>

              {/* Test Email Form */}
              <div className="mt-8 pt-8 border-t border-slate-100 space-y-4">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Mail className="h-4.5 w-4.5 text-primary" />
                  Enviar E-mail de Teste
                </h4>
                <p className="text-xs text-slate-500">
                  {isBrevo
                    ? 'Teste a integração Brevo API enviando um e-mail de teste para o endereço informado.'
                    : 'Teste as configurações SMTP salvas enviando um e-mail de teste para o endereço informado.'}
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
              <div className="flex items-center gap-1.5">
                <strong>Provedor:</strong>
                {selectedLog?.provider === 'brevo' ? (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold">
                    <Zap className="h-2.5 w-2.5" /> Brevo API
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200 gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold">
                    <Server className="h-2.5 w-2.5" /> SMTP
                  </Badge>
                )}
              </div>
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
