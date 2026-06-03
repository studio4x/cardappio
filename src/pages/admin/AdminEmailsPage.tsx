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
  useEmailLogs
} from '@/hooks/admin/useAdminEmails'
import type { EmailLog } from '@/hooks/admin/useAdminEmails'
import { 
  Mail, 
  Settings, 
  History, 
  Copy, 
  Eye, 
  Check, 
  EyeOff, 
  CheckCircle2, 
  XCircle,
  FileText,
  Lock,
  ArrowRight
} from 'lucide-react'
import { toast } from 'sonner'

// Supabase Auth static templates for copy/preview
const supabaseTemplates = [
  {
    id: 'confirm-signup',
    name: 'Confirmação de Cadastro',
    description: 'Enviado para novos usuários verificarem seus e-mails.',
    subject: 'Confirme seu e-mail no Cardappio',
    html: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirme seu e-mail no Cardappio</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&family=Work+Sans:wght@400;500&display=swap');
    body {
      font-family: 'Work Sans', Arial, sans-serif;
      background-color: #f8fafc;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.025);
      border: 1px solid #e2e8f0;
    }
    .header {
      padding: 32px;
      text-align: center;
      border-bottom: 1px solid #f1f5f9;
    }
    .content {
      padding: 40px 32px;
      color: #171d16;
      line-height: 1.6;
    }
    .footer {
      padding: 32px;
      text-align: center;
      background-color: #f8fafc;
      border-top: 1px solid #f1f5f9;
      font-size: 12px;
      color: #757575;
    }
    .btn {
      display: inline-block;
      background-color: #f76f25;
      color: #ffffff !important;
      padding: 12px 24px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      margin-top: 24px;
      font-family: 'Plus Jakarta Sans', Arial, sans-serif;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
        <tr>
          <td style="background-color: #f76f25; border-radius: 10px; width: 36px; height: 36px; text-align: center; vertical-align: middle; color: #ffffff; font-weight: bold; font-size: 20px; font-family: 'Plus Jakarta Sans', Arial, sans-serif;">
            🍳
          </td>
          <td style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 22px; font-weight: 800; color: #171d16; letter-spacing: -0.5px; padding-left: 8px;">
            Cardappio
          </td>
        </tr>
      </table>
    </div>
    <div class="content" style="text-align: center;">
      <h2 style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 22px; font-weight: 600; color: #171d16; margin-top: 0; margin-bottom: 16px;">
        Confirme seu e-mail
      </h2>
      <p style="margin-bottom: 16px; font-size: 16px; color: #3f4a3c;">
        Obrigado por se cadastrar no Cardappio! Para ativar a sua conta e começar a organizar seu planejamento semanal, por favor confirme o seu e-mail clicando no botão abaixo:
      </p>
      <div style="margin-top: 24px; margin-bottom: 24px;">
        <a href="{{ .ConfirmationURL }}" class="btn">
          Confirmar E-mail
        </a>
      </div>
      <p style="margin-top: 24px; font-size: 14px; color: #757575;">
        Se você não solicitou este cadastro, pode ignorar este e-mail com segurança.
      </p>
    </div>
    <div class="footer">
      <p style="margin: 0 0 8px 0;">Este é um e-mail automático enviado pela plataforma Cardappio.</p>
      <p style="margin: 0;">© 2026 Cardappio. Todos os direitos reservados.</p>
    </div>
  </div>
</body>
</html>`
  },
  {
    id: 'invite-user',
    name: 'Convite de Usuário',
    description: 'Enviado quando o administrador convida um usuário via painel.',
    subject: 'Você foi convidado para o Cardappio',
    html: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Você foi convidado para o Cardappio</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&family=Work+Sans:wght@400;500&display=swap');
    body {
      font-family: 'Work Sans', Arial, sans-serif;
      background-color: #f8fafc;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.025);
      border: 1px solid #e2e8f0;
    }
    .header {
      padding: 32px;
      text-align: center;
      border-bottom: 1px solid #f1f5f9;
    }
    .content {
      padding: 40px 32px;
      color: #171d16;
      line-height: 1.6;
    }
    .footer {
      padding: 32px;
      text-align: center;
      background-color: #f8fafc;
      border-top: 1px solid #f1f5f9;
      font-size: 12px;
      color: #757575;
    }
    .btn {
      display: inline-block;
      background-color: #f76f25;
      color: #ffffff !important;
      padding: 12px 24px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      margin-top: 24px;
      font-family: 'Plus Jakarta Sans', Arial, sans-serif;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
        <tr>
          <td style="background-color: #f76f25; border-radius: 10px; width: 36px; height: 36px; text-align: center; vertical-align: middle; color: #ffffff; font-weight: bold; font-size: 20px; font-family: 'Plus Jakarta Sans', Arial, sans-serif;">
            🍳
          </td>
          <td style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 22px; font-weight: 800; color: #171d16; letter-spacing: -0.5px; padding-left: 8px;">
            Cardappio
          </td>
        </tr>
      </table>
    </div>
    <div class="content" style="text-align: center;">
      <h2 style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 22px; font-weight: 600; color: #171d16; margin-top: 0; margin-bottom: 16px;">
        Você foi convidado!
      </h2>
      <p style="margin-bottom: 16px; font-size: 16px; color: #3f4a3c;">
        Você foi convidado para participar da plataforma Cardappio. Para aceitar o seu convite e ativar a sua conta, por favor clique no botão abaixo:
      </p>
      <div style="margin-top: 24px; margin-bottom: 24px;">
        <a href="{{ .ConfirmationURL }}" class="btn">
          Aceitar Convite
        </a>
      </div>
      <p style="margin-top: 24px; font-size: 14px; color: #757575;">
        Este link de convite expirará em breve.
      </p>
    </div>
    <div class="footer">
      <p style="margin: 0 0 8px 0;">Este é um e-mail automático enviado pela plataforma Cardappio.</p>
      <p style="margin: 0;">© 2026 Cardappio. Todos os direitos reservados.</p>
    </div>
  </div>
</body>
</html>`
  },
  {
    id: 'magic-link',
    name: 'Link de Login (Magic Link)',
    description: 'Enviado quando o usuário solicita o login sem senha por e-mail.',
    subject: 'Seu link de acesso ao Cardappio',
    html: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Seu link de acesso ao Cardappio</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&family=Work+Sans:wght@400;500&display=swap');
    body {
      font-family: 'Work Sans', Arial, sans-serif;
      background-color: #f8fafc;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.025);
      border: 1px solid #e2e8f0;
    }
    .header {
      padding: 32px;
      text-align: center;
      border-bottom: 1px solid #f1f5f9;
    }
    .content {
      padding: 40px 32px;
      color: #171d16;
      line-height: 1.6;
    }
    .footer {
      padding: 32px;
      text-align: center;
      background-color: #f8fafc;
      border-top: 1px solid #f1f5f9;
      font-size: 12px;
      color: #757575;
    }
    .btn {
      display: inline-block;
      background-color: #f76f25;
      color: #ffffff !important;
      padding: 12px 24px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      margin-top: 24px;
      font-family: 'Plus Jakarta Sans', Arial, sans-serif;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
        <tr>
          <td style="background-color: #f76f25; border-radius: 10px; width: 36px; height: 36px; text-align: center; vertical-align: middle; color: #ffffff; font-weight: bold; font-size: 20px; font-family: 'Plus Jakarta Sans', Arial, sans-serif;">
            🍳
          </td>
          <td style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 22px; font-weight: 800; color: #171d16; letter-spacing: -0.5px; padding-left: 8px;">
            Cardappio
          </td>
        </tr>
      </table>
    </div>
    <div class="content" style="text-align: center;">
      <h2 style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 22px; font-weight: 600; color: #171d16; margin-top: 0; margin-bottom: 16px;">
        Link de Acesso Rápido
      </h2>
      <p style="margin-bottom: 16px; font-size: 16px; color: #3f4a3c;">
        Clique no botão abaixo para entrar de forma rápida e segura na sua conta do Cardappio:
      </p>
      <div style="margin-top: 24px; margin-bottom: 24px;">
        <a href="{{ .ConfirmationURL }}" class="btn">
          Entrar no Cardappio
        </a>
      </div>
      <p style="margin-top: 24px; font-size: 14px; color: #757575;">
        Se você não solicitou este link de acesso, por favor ignore este e-mail.
      </p>
    </div>
    <div class="footer">
      <p style="margin: 0 0 8px 0;">Este é um e-mail automático enviado pela plataforma Cardappio.</p>
      <p style="margin: 0;">© 2026 Cardappio. Todos os direitos reservados.</p>
    </div>
  </div>
</body>
</html>`
  },
  {
    id: 'recover-password',
    name: 'Redefinição de Senha',
    description: 'Enviado quando o usuário solicita recuperar sua senha de acesso.',
    subject: 'Redefinição de senha do Cardappio',
    html: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Redefinição de senha do Cardappio</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&family=Work+Sans:wght@400;500&display=swap');
    body {
      font-family: 'Work Sans', Arial, sans-serif;
      background-color: #f8fafc;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.025);
      border: 1px solid #e2e8f0;
    }
    .header {
      padding: 32px;
      text-align: center;
      border-bottom: 1px solid #f1f5f9;
    }
    .content {
      padding: 40px 32px;
      color: #171d16;
      line-height: 1.6;
    }
    .footer {
      padding: 32px;
      text-align: center;
      background-color: #f8fafc;
      border-top: 1px solid #f1f5f9;
      font-size: 12px;
      color: #757575;
    }
    .btn {
      display: inline-block;
      background-color: #f76f25;
      color: #ffffff !important;
      padding: 12px 24px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      margin-top: 24px;
      font-family: 'Plus Jakarta Sans', Arial, sans-serif;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
        <tr>
          <td style="background-color: #f76f25; border-radius: 10px; width: 36px; height: 36px; text-align: center; vertical-align: middle; color: #ffffff; font-weight: bold; font-size: 20px; font-family: 'Plus Jakarta Sans', Arial, sans-serif;">
            🍳
          </td>
          <td style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 22px; font-weight: 800; color: #171d16; letter-spacing: -0.5px; padding-left: 8px;">
            Cardappio
          </td>
        </tr>
      </table>
    </div>
    <div class="content" style="text-align: center;">
      <h2 style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 22px; font-weight: 600; color: #171d16; margin-top: 0; margin-bottom: 16px;">
        Redefinir Senha
      </h2>
      <p style="margin-bottom: 16px; font-size: 16px; color: #3f4a3c;">
        Recebemos um pedido para redefinir a senha da sua conta no Cardappio. Para cadastrar uma nova senha, por favor clique no botão abaixo:
      </p>
      <div style="margin-top: 24px; margin-bottom: 24px;">
        <a href="{{ .ConfirmationURL }}" class="btn">
          Redefinir Senha
        </a>
      </div>
      <p style="margin-top: 24px; font-size: 14px; color: #757575;">
        Se você não fez essa solicitação, pode ignorar este e-mail com segurança. Sua senha atual continuará funcionando normalmente.
      </p>
    </div>
    <div class="footer">
      <p style="margin: 0 0 8px 0;">Este é um e-mail automático enviado pela plataforma Cardappio.</p>
      <p style="margin: 0;">© 2026 Cardappio. Todos os direitos reservados.</p>
    </div>
  </div>
</body>
</html>`
  }
]

export function AdminEmailsPage() {
  const { data: config, isLoading: isConfigLoading, error: configError } = useEmailConfig()
  const updateConfig = useUpdateEmailConfig()
  const { data: logs, isLoading: isLogsLoading, error: logsError, refetch: refetchLogs } = useEmailLogs()

  // State for Config Form
  const [formData, setFormData] = useState({
    provider: 'resend',
    resend_api_key: '',
    from_email: ''
  })
  const [showApiKey, setShowApiKey] = useState(false)
  const [isSavedInit, setIsSavedInit] = useState(false)

  // Sync config data to form state once loaded
  if (config && !isSavedInit) {
    setFormData({
      provider: config.provider || 'resend',
      resend_api_key: config.resend_api_key || '',
      from_email: config.from_email || ''
    })
    setIsSavedInit(true)
  }

  // State for Log View Modal
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null)
  const [isLogModalOpen, setIsLogModalOpen] = useState(false)

  // State for Templates View
  const [activeTemplate, setActiveTemplate] = useState(supabaseTemplates[0])
  const [copiedText, setCopiedText] = useState(false)

  // State for search/filter logs
  const [searchTerm, setSearchTerm] = useState('')

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await updateConfig.mutateAsync(formData)
      toast.success('Configurações de e-mail salvas com sucesso!')
    } catch (err: any) {
      toast.error('Erro ao salvar configurações de e-mail.')
    }
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedText(true)
    toast.success('Código HTML copiado para a área de transferência!')
    setTimeout(() => setCopiedText(false), 2000)
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
        subtitle="Gerencie configurações de envio, audite e-mails disparados e copie templates prontos para o Supabase Auth."
      />

      <Tabs defaultValue="logs">
        <TabsList className="mb-4" variant="pill">
          <TabsTrigger value="logs">
            <History className="h-4 w-4 mr-2" />
            Auditoria (Logs)
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Configuração
          </TabsTrigger>
          <TabsTrigger value="templates">
            <FileText className="h-4 w-4 mr-2" />
            Templates Supabase
          </TabsTrigger>
        </TabsList>

        {/* LOGS AUDITING TAB */}
        <TabsContent value="logs">
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-lg font-bold text-slate-800">Histórico de Disparos</h3>
              <Input
                placeholder="Pesquisar por destinatário ou assunto..."
                className="max-w-xs"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
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

        {/* SETTINGS TAB */}
        <TabsContent value="settings">
          <div className="max-w-2xl bg-white border rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Provedor de E-mail</h3>
            <p className="text-sm text-slate-500 mb-6">
              A plataforma utiliza o **Resend** para disparar e-mails transacionais (boas-vindas, notificações, etc.). Insira a sua chave API e e-mail remetente abaixo.
            </p>

            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="provider">Provedor</Label>
                <Input 
                  id="provider"
                  value={formData.provider.toUpperCase()} 
                  disabled 
                  className="bg-slate-50 font-bold"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="resend_api_key">Chave API do Resend</Label>
                <div className="relative">
                  <Input
                    id="resend_api_key"
                    type={showApiKey ? 'text' : 'password'}
                    placeholder="re_..."
                    value={formData.resend_api_key}
                    onChange={(e) => setFormData({ ...formData, resend_api_key: e.target.value })}
                    required
                    className="pr-10 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="from_email">E-mail Remetente (From)</Label>
                <Input
                  id="from_email"
                  placeholder="Cardappio <onboarding@resend.dev>"
                  value={formData.from_email}
                  onChange={(e) => setFormData({ ...formData, from_email: e.target.value })}
                  required
                />
                <p className="text-xs text-slate-400">
                  Importante: O domínio do e-mail remetente deve estar verificado e configurado na sua conta do Resend para evitar falhas de envio.
                </p>
              </div>

              <div className="pt-4 flex items-center gap-4">
                <Button type="submit" disabled={updateConfig.isPending} className="px-6 rounded-full font-bold">
                  {updateConfig.isPending ? 'Salvando...' : 'Salvar Configurações'}
                </Button>
              </div>
            </form>
          </div>
        </TabsContent>

        {/* TEMPLATES VIEW TAB */}
        <TabsContent value="templates">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Sidebar list of templates */}
            <div className="lg:col-span-4 space-y-3">
              <h3 className="text-md font-bold text-slate-800 px-1">Templates do Supabase</h3>
              {supabaseTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setActiveTemplate(template)}
                  className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between ${
                    activeTemplate.id === template.id 
                      ? 'border-[#f76f25] bg-[#f76f25]/5 shadow-sm' 
                      : 'border-slate-100 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="pr-2 leading-none">
                    <span className={`text-xs font-bold ${activeTemplate.id === template.id ? 'text-[#f76f25]' : 'text-slate-800'}`}>
                      {template.name}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1 block font-normal leading-tight">
                      {template.description}
                    </span>
                  </div>
                  <ArrowRight className={`h-4 w-4 shrink-0 ${activeTemplate.id === template.id ? 'text-[#f76f25]' : 'text-slate-400'}`} />
                </button>
              ))}

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-2 mt-4">
                <div className="flex items-center gap-1 font-bold">
                  <Lock className="h-3.5 w-3.5" />
                  Como Configurar no Supabase:
                </div>
                <p>1. Acesse o Supabase Dashboard.</p>
                <p>2. Vá para **Authentication** &gt; **Email Templates**.</p>
                <p>3. Copie o HTML do template desejado ao lado e cole no respectivo campo **Body**.</p>
              </div>
            </div>

            {/* Code / Visual Preview container */}
            <div className="lg:col-span-8 bg-white border rounded-2xl overflow-hidden shadow-sm flex flex-col min-h-[500px]">
              <div className="bg-slate-50 border-b px-6 py-4 flex items-center justify-between flex-wrap gap-3">
                <div className="leading-tight">
                  <h4 className="text-sm font-bold text-slate-800">{activeTemplate.name}</h4>
                  <span className="text-[11px] text-slate-400 font-mono">Assunto: {activeTemplate.subject}</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleCopyCode(activeTemplate.html)}
                  className="gap-1.5 rounded-full font-bold shadow-sm"
                >
                  {copiedText ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                  {copiedText ? 'Copiado' : 'Copiar HTML'}
                </Button>
              </div>

              <div className="flex-1 flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x">
                {/* Code Block */}
                <div className="flex-1 p-4 bg-slate-900 overflow-auto font-mono text-[10px] text-slate-300 max-h-[500px] lg:max-h-none select-all whitespace-pre">
                  {activeTemplate.html}
                </div>
                
                {/* Visual Live Preview in iframe */}
                <div className="flex-1 bg-slate-50 p-4 flex items-center justify-center">
                  <div className="w-full h-[400px] lg:h-full max-w-sm rounded-xl border bg-white shadow-sm overflow-hidden flex flex-col">
                    <div className="bg-slate-100 px-3 py-1.5 border-b text-[10px] text-slate-500 font-mono flex items-center gap-1.5">
                      <div className="flex gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-400 block" />
                        <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 block" />
                        <span className="w-2.5 h-2.5 rounded-full bg-green-400 block" />
                      </div>
                      <span className="truncate">Visualização Prévia</span>
                    </div>
                    <iframe
                      title="Preview"
                      className="w-full flex-1 border-0"
                      srcDoc={activeTemplate.html.replace(/\{\{\s*\.ConfirmationURL\s*\}\}/g, 'https://cardappio-mauve.vercel.app')}
                    />
                  </div>
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
