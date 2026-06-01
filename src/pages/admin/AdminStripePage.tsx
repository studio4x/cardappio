import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { ShieldCheck, ShieldAlert, CreditCard, HelpCircle, Link as LinkIcon, RefreshCw } from 'lucide-react'

interface StripeConfig {
  mode: 'sandbox' | 'production'
  sandbox_publishable_key: string
  sandbox_secret_key: string
  sandbox_webhook_secret: string
  production_publishable_key: string
  production_secret_key: string
  production_webhook_secret: string
}

export function AdminStripePage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  
  // Form State
  const [config, setConfig] = useState<StripeConfig>({
    mode: 'sandbox',
    sandbox_publishable_key: '',
    sandbox_secret_key: '',
    sandbox_webhook_secret: '',
    production_publishable_key: '',
    production_secret_key: '',
    production_webhook_secret: ''
  })

  // Connection Test State
  const [testResult, setTestResult] = useState<{
    tested: boolean
    success: boolean
    message: string
    accountId?: string
    businessProfile?: string
  } | null>(null)

  // Webhook URL
  const webhookUrl = "https://wkngjvsgafmdwejmckks.supabase.co/functions/v1/subscription-webhook"

  useEffect(() => {
    fetchStripeConfig()
  }, [])

  const fetchStripeConfig = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value_json')
        .eq('setting_key', 'stripe_config')
        .single()

      if (error) throw error
      if (data?.value_json) {
        setConfig(data.value_json as StripeConfig)
      }
    } catch (err: any) {
      console.error('Error fetching Stripe config:', err)
      toast.error('Erro ao carregar configurações do Stripe.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setTestResult(null)
    
    try {
      const { error } = await supabase
        .from('app_settings')
        .update({
          value_json: config,
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', 'stripe_config')

      if (error) throw error
      toast.success('Configurações salvas com sucesso!')
    } catch (err: any) {
      console.error('Error saving Stripe config:', err)
      toast.error('Erro ao salvar configurações.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleTestConnection = async () => {
    setIsValidating(true)
    setTestResult(null)

    try {
      const { data, error } = await supabase.functions.invoke('verify-stripe-connection', {
        method: 'POST'
      })

      if (error) throw error

      if (data?.success) {
        setTestResult({
          tested: true,
          success: true,
          message: `Conexão efetuada com sucesso no modo ${data.mode === 'production' ? 'Produção' : 'Sandbox'}.`,
          accountId: data.account_id,
          businessProfile: data.business_profile
        })
        toast.success('Conexão testada com sucesso!')
      } else {
        setTestResult({
          tested: true,
          success: false,
          message: data?.error || 'Erro desconhecido na validação com o Stripe.'
        })
        toast.error('Falha na validação com o Stripe.')
      }
    } catch (err: any) {
      console.error('Error validating Stripe connection:', err)
      setTestResult({
        tested: true,
        success: false,
        message: err.message || 'Erro de rede ou falha na requisição da Edge Function.'
      })
      toast.error('Erro ao testar conexão.')
    } finally {
      setIsValidating(false)
    }
  }

  if (isLoading) {
    return <LoadingState message="Carregando configurações do Stripe..." />
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      <PageHeader 
        title="Integração Stripe" 
        subtitle="Gerencie chaves de API, webhook e ambiente do Stripe."
      />

      <form onSubmit={handleSave} className="space-y-6">
        {/* Toggle Sandbox / Production */}
        <div className="rounded-2xl border p-6 bg-white shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-bold">Ambiente Ativo</Label>
              <p className="text-xs text-muted-foreground">Alterna de onde o app fará as chamadas e buscará as credenciais.</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfig({ ...config, mode: 'sandbox' })}
                className={`px-4 py-2 text-xs font-bold uppercase rounded-lg border transition-all cursor-pointer ${
                  config.mode === 'sandbox'
                    ? 'bg-amber-100 text-amber-800 border-amber-300 shadow-sm'
                    : 'bg-white hover:bg-slate-50 text-slate-500'
                }`}
              >
                Sandbox (Testes)
              </button>
              <button
                type="button"
                onClick={() => setConfig({ ...config, mode: 'production' })}
                className={`px-4 py-2 text-xs font-bold uppercase rounded-lg border transition-all cursor-pointer ${
                  config.mode === 'production'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300 shadow-sm'
                    : 'bg-white hover:bg-slate-50 text-slate-500'
                }`}
              >
                Produção (Real)
              </button>
            </div>
          </div>
        </div>

        {/* Credentials Form */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Sandbox Credentials */}
          <div className="rounded-2xl border p-6 bg-white shadow-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1.5">
              <CreditCard className="h-4 w-4" /> Sandbox (Testes)
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="sandbox_pub">Chave Pública (Publishable Key)</Label>
              <Input 
                id="sandbox_pub" 
                value={config.sandbox_publishable_key} 
                onChange={e => setConfig({ ...config, sandbox_publishable_key: e.target.value })} 
                placeholder="pk_test_..."
                className="bg-white text-slate-900"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sandbox_sec">Chave Secreta (Secret Key)</Label>
              <Input 
                id="sandbox_sec" 
                type="password"
                value={config.sandbox_secret_key} 
                onChange={e => setConfig({ ...config, sandbox_secret_key: e.target.value })} 
                placeholder="sk_test_..."
                className="bg-white text-slate-900"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sandbox_web">Segredo do Webhook (Webhook Secret)</Label>
              <Input 
                id="sandbox_web" 
                type="password"
                value={config.sandbox_webhook_secret} 
                onChange={e => setConfig({ ...config, sandbox_webhook_secret: e.target.value })} 
                placeholder="whsec_..."
                className="bg-white text-slate-900"
              />
            </div>
          </div>

          {/* Production Credentials */}
          <div className="rounded-2xl border p-6 bg-white shadow-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
              <CreditCard className="h-4 w-4" /> Produção (Real)
            </h3>

            <div className="space-y-2">
              <Label htmlFor="prod_pub">Chave Pública (Publishable Key)</Label>
              <Input 
                id="prod_pub" 
                value={config.production_publishable_key} 
                onChange={e => setConfig({ ...config, production_publishable_key: e.target.value })} 
                placeholder="pk_live_..."
                className="bg-white text-slate-900"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="prod_sec">Chave Secreta (Secret Key)</Label>
              <Input 
                id="prod_sec" 
                type="password"
                value={config.production_secret_key} 
                onChange={e => setConfig({ ...config, production_secret_key: e.target.value })} 
                placeholder="sk_live_..."
                className="bg-white text-slate-900"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prod_web">Segredo do Webhook (Webhook Secret)</Label>
              <Input 
                id="prod_web" 
                type="password"
                value={config.production_webhook_secret} 
                onChange={e => setConfig({ ...config, production_webhook_secret: e.target.value })} 
                placeholder="whsec_..."
                className="bg-white text-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Webhook Info Card */}
        <div className="rounded-2xl border p-6 bg-slate-50 border-slate-200 space-y-4">
          <h3 className="font-bold flex items-center gap-2 text-slate-900">
            <HelpCircle className="h-5 w-5 text-primary" /> Como configurar o Webhook no Stripe?
          </h3>
          
          <div className="space-y-3 text-xs leading-relaxed text-slate-600">
            <p>
              Para que os pagamentos sincronizem automaticamente com as contas dos usuários, você precisa configurar um Endpoint de Webhook no painel do Stripe:
            </p>
            <div className="flex items-center gap-2 p-3 bg-white border rounded-xl font-mono text-slate-800 break-all select-all">
              <LinkIcon className="h-4 w-4 shrink-0 text-slate-400" />
              {webhookUrl}
            </div>
            <p>
              Adicione os seguintes **Eventos** ao webhook:
            </p>
            <ul className="list-disc pl-5 space-y-1 font-semibold text-slate-800">
              <li><code>checkout.session.completed</code></li>
              <li><code>customer.subscription.updated</code></li>
              <li><code>customer.subscription.deleted</code></li>
            </ul>
            <p className="text-[10px] text-muted-foreground italic">
              *Após cadastrar no Stripe, copie o "Segredo de assinatura do webhook" (ex: whsec_...) e insira nos campos acima correspondentes.
            </p>
          </div>
        </div>

        {/* Save and Test Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            type="submit" 
            className="flex-1 rounded-full py-6 font-bold" 
            disabled={isSaving}
          >
            {isSaving ? 'Salvando...' : 'Salvar Configurações'}
          </Button>

          <Button 
            type="button" 
            variant="outline"
            onClick={handleTestConnection}
            disabled={isValidating || isSaving}
            className="flex-1 rounded-full py-6 border-primary text-primary hover:bg-primary/5 font-bold gap-2"
          >
            {isValidating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" /> Testando...
              </>
            ) : (
              'Testar Conexão'
            )}
          </Button>
        </div>
      </form>

      {/* Test Result Display */}
      {testResult && (
        <div className={`rounded-2xl border p-5 flex gap-4 ${
          testResult.success 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <div className="mt-0.5">
            {testResult.success ? (
              <ShieldCheck className="h-6 w-6 text-emerald-600" />
            ) : (
              <ShieldAlert className="h-6 w-6 text-rose-600" />
            )}
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-sm">
              {testResult.success ? 'Conexão Bem-Sucedida!' : 'Erro na Integração'}
            </h4>
            <p className="text-xs leading-relaxed">{testResult.message}</p>
            {testResult.success && (
              <div className="text-[10px] font-mono opacity-85 mt-2 space-y-0.5">
                <div>ID Conta: {testResult.accountId}</div>
                <div>Negócio: {testResult.businessProfile}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function LoadingState({ message }: { message: string }) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 text-center">
      <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm font-semibold text-muted-foreground">{message}</p>
    </div>
  )
}
