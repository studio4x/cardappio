import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { LoadingState } from '@/components/shared/LoadingState'
import { useAdminSettings } from '@/hooks/admin/useAdminSettings'
import { useAIConfig, useUpdateAIConfig, type AIConfig } from '@/hooks/admin/useAIConfig'
import { Image as ImageIcon, Save, Trash2, Palette, Shield, Settings2, HelpCircle, Brain, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function AdminSettingsPage() {
  const { loading, visualIdentity, updateVisualIdentity, uploadAsset, vercelWebhookUrl, updateVercelWebhookUrl } = useAdminSettings()
  const [vercelUrlInput, setVercelUrlInput] = useState('')

  useEffect(() => {
    setVercelUrlInput(vercelWebhookUrl || '')
  }, [vercelWebhookUrl])

  // Calculadora de estilos para a pré-visualização da marca d'água
  const sizePercent = visualIdentity?.watermark_size || 24
  const position = visualIdentity?.watermark_position || 'top_left'
  
  let previewWatermarkStyle: React.CSSProperties = {
    width: `${sizePercent}%`,
    position: 'absolute',
    pointerEvents: 'none',
    userSelect: 'none',
    zIndex: 10
  }

  if (position === 'top_left') {
    previewWatermarkStyle.top = '4%'
    previewWatermarkStyle.left = '4%'
  } else if (position === 'top_right') {
    previewWatermarkStyle.top = '4%'
    previewWatermarkStyle.right = '4%'
  } else if (position === 'bottom_left') {
    previewWatermarkStyle.bottom = '4%'
    previewWatermarkStyle.left = '4%'
  } else if (position === 'bottom_right') {
    previewWatermarkStyle.bottom = '4%'
    previewWatermarkStyle.right = '4%'
  } else if (position === 'center') {
    previewWatermarkStyle.top = '50%'
    previewWatermarkStyle.left = '50%'
    previewWatermarkStyle.transform = 'translate(-50%, -50%)'
  }

  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('visual')

  // AI Config state
  const { data: aiConfig, isLoading: isLoadingAI } = useAIConfig()
  const updateAIConfig = useUpdateAIConfig()
  const [aiForm, setAIForm] = useState<AIConfig>({
    openai_api_key: '',
    gemini_api_key: '',
    preferred_provider: 'openai'
  })
  const [showOpenAIKey, setShowOpenAIKey] = useState(false)
  const [showGeminiKey, setShowGeminiKey] = useState(false)
  const [aiFormDirty, setAIFormDirty] = useState(false)

  // Sync AI form when config loads
  const [aiFormInitialized, setAIFormInitialized] = useState(false)
  if (aiConfig && !aiFormInitialized) {
    setAIForm(aiConfig)
    setAIFormInitialized(true)
  }

  const handleAIFormChange = (field: keyof AIConfig, value: string) => {
    setAIForm(prev => ({ ...prev, [field]: value }))
    setAIFormDirty(true)
  }

  const handleSaveAIConfig = async () => {
    await updateAIConfig.mutateAsync(aiForm)
    setAIFormDirty(false)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo_dark_url' | 'logo_light_url' | 'favicon_url' | 'watermark_url') => {
    const file = e.target.files?.[0]
    if (!file) return

    const url = await uploadAsset(file, type.replace('_url', ''))
    if (url) {
      await updateVisualIdentity({
        ...visualIdentity,
        [type]: url
      })
    }
  }

  const handleRemoveAsset = async (type: 'logo_dark_url' | 'logo_light_url' | 'favicon_url' | 'watermark_url') => {
    if (confirm('Tem certeza que deseja remover este item?')) {
      await updateVisualIdentity({
        ...visualIdentity,
        [type]: ''
      })
    }
  }

  if (loading) return <LoadingState message="Carregando configurações..." />

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader 
        title="Configurações Globais" 
        subtitle="Gerencie a identidade visual, segurança e parâmetros do sistema." 
      />

      <Tabs defaultValue="visual" className="w-full" onValueChange={setActiveTab}>
        <TabsList variant="line" className="mb-6">
          <TabsTrigger value="visual" className="gap-2">
            <Palette className="h-4 w-4" />
            Identidade Visual
          </TabsTrigger>
          <TabsTrigger value="ia" className="gap-2">
            <Brain className="h-4 w-4" />
            Integrações IA
          </TabsTrigger>
          <TabsTrigger value="geral" className="gap-2">
            <Settings2 className="h-4 w-4" />
            Geral
          </TabsTrigger>
          <TabsTrigger value="seguranca" className="gap-2">
            <Shield className="h-4 w-4" />
            Segurança
          </TabsTrigger>
          <TabsTrigger value="ajuda" className="gap-2">
            <HelpCircle className="h-4 w-4" />
            Suporte
          </TabsTrigger>
        </TabsList>

        {/* TAB: IDENTIDADE VISUAL */}
        <TabsContent value="visual" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Logo Dark */}
            <div className="rounded-2xl border bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm uppercase tracking-wider text-slate-500">Logo Dark</h3>
                <span className="text-[10px] bg-slate-100 px-2 py-1 rounded-full font-bold">Fundo Claro</span>
              </div>
              <div className="aspect-video rounded-xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center relative group overflow-hidden transition-all hover:border-primary/50">
                {visualIdentity.logo_dark_url ? (
                  <>
                    <img src={visualIdentity.logo_dark_url} alt="Logo Dark" className="max-h-[70%] max-w-[80%] object-contain" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button 
                        onClick={() => handleRemoveAsset('logo_dark_url')}
                        className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </>
                ) : (
                  <label className="flex flex-col items-center gap-2 cursor-pointer w-full h-full justify-center">
                    <ImageIcon className="h-8 w-8 text-slate-300" />
                    <span className="text-xs text-slate-400 font-medium">Upload Logo Dark</span>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo_dark_url')} />
                  </label>
                )}
              </div>
              <p className="text-[11px] text-slate-400">Exibido em fundos claros (Header, Landing Page).</p>
            </div>

            {/* Logo Light */}
            <div className="rounded-2xl border bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm uppercase tracking-wider text-slate-500">Logo Light</h3>
                <span className="text-[10px] bg-slate-900 text-white px-2 py-1 rounded-full font-bold">Fundo Escuro</span>
              </div>
              <div className="aspect-video rounded-xl bg-slate-900 border-2 border-dashed border-slate-700 flex flex-col items-center justify-center relative group overflow-hidden transition-all hover:border-primary/50">
                {visualIdentity.logo_light_url ? (
                  <>
                    <img src={visualIdentity.logo_light_url} alt="Logo Light" className="max-h-[70%] max-w-[80%] object-contain" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button 
                        onClick={() => handleRemoveAsset('logo_light_url')}
                        className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </>
                ) : (
                  <label className="flex flex-col items-center gap-2 cursor-pointer w-full h-full justify-center text-slate-500">
                    <ImageIcon className="h-8 w-8 text-slate-600" />
                    <span className="text-xs font-medium">Upload Logo Light</span>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo_light_url')} />
                  </label>
                )}
              </div>
              <p className="text-[11px] text-slate-400">Exibido em fundos escuros ou modo dark.</p>
            </div>

            {/* Favicon */}
            <div className="rounded-2xl border bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm uppercase tracking-wider text-slate-500">Favicon</h3>
                <span className="text-[10px] bg-slate-100 px-2 py-1 rounded-full font-bold">Ícone do Navegador</span>
              </div>
              <div className="aspect-video rounded-xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center relative group overflow-hidden transition-all hover:border-primary/50">
                {visualIdentity.favicon_url ? (
                  <>
                    <img src={visualIdentity.favicon_url} alt="Favicon" className="h-12 w-12 object-contain" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button 
                        onClick={() => handleRemoveAsset('favicon_url')}
                        className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </>
                ) : (
                  <label className="flex flex-col items-center gap-2 cursor-pointer w-full h-full justify-center">
                    <ImageIcon className="h-8 w-8 text-slate-300" />
                    <span className="text-xs text-slate-400 font-medium">Upload Favicon</span>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'favicon_url')} />
                  </label>
                )}
              </div>
              <p className="text-[11px] text-slate-400">Ícone exibido na aba do navegador (32x32px sugerido).</p>
            </div>

          </div>

          {/* Seção Completa da Marca d'água */}
          <div className="col-span-full rounded-2xl border bg-white p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b pb-4">
              <div className="p-2 bg-primary/10 text-primary rounded-lg">
                <ImageIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-800">Marca d'água de Receitas</h3>
                <p className="text-xs text-slate-500">Adicione e posicione o logotipo da sua marca sobre todas as fotos de capa do aplicativo.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Controles */}
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Arquivo do Logotipo</label>
                  <div className="h-32 rounded-xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center relative group overflow-hidden transition-all hover:border-primary/50">
                    {visualIdentity.watermark_url ? (
                      <>
                        <img src={visualIdentity.watermark_url} alt="Marca d'água" className="max-h-[80%] max-w-[80%] object-contain" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button 
                            onClick={() => handleRemoveAsset('watermark_url')}
                            className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <label className="flex flex-col items-center gap-2 cursor-pointer w-full h-full justify-center">
                        <ImageIcon className="h-8 w-8 text-slate-300" />
                        <span className="text-xs text-slate-400 font-medium">Fazer Upload do Logotipo</span>
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'watermark_url')} />
                      </label>
                    )}
                  </div>
                </div>

                {visualIdentity.watermark_url && (
                  <>
                    {/* Posição */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Posição do Logotipo</label>
                      <select
                        value={visualIdentity.watermark_position || 'top_left'}
                        onChange={(e) => {
                          updateVisualIdentity({
                            ...visualIdentity,
                            watermark_position: e.target.value
                          })
                        }}
                        className="w-full text-sm border rounded-xl px-3 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer font-medium"
                      >
                        <option value="top_left">Superior Esquerdo</option>
                        <option value="top_right">Superior Direito</option>
                        <option value="bottom_left">Inferior Esquerdo</option>
                        <option value="bottom_right">Inferior Direito</option>
                        <option value="center">Centralizado</option>
                      </select>
                    </div>

                    {/* Tamanho */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tamanho do Logotipo</label>
                        <span className="text-xs font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                          {visualIdentity.watermark_size || 24}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="50"
                        value={visualIdentity.watermark_size || 24}
                        onChange={(e) => {
                          updateVisualIdentity({
                            ...visualIdentity,
                            watermark_size: parseInt(e.target.value)
                          })
                        }}
                        className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                        <span>Compacto (10%)</span>
                        <span>Grande (50%)</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Preview Interativo */}
              <div className="flex flex-col justify-center items-center space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider self-start">Pré-visualização em Tempo Real</label>
                <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border border-slate-200 shadow bg-slate-100 select-none">
                  {/* Imagem de prato de comida de demonstração */}
                  <img 
                    src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600&auto=format&fit=crop" 
                    alt="Demonstração" 
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Logotipo da Marca d'água posicionado dinamicamente */}
                  {visualIdentity.watermark_url && (
                    <div style={previewWatermarkStyle} className="transition-all duration-200">
                      <img 
                        src={visualIdentity.watermark_url} 
                        alt="Marca d'água Preview" 
                        className="w-full h-auto object-contain"
                      />
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                  A pré-visualização simula como o logotipo é fundido graficamente no aplicativo.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-6">
            <h4 className="font-bold text-amber-800 text-sm mb-2">Dica de Design</h4>
            <p className="text-xs text-amber-700 leading-relaxed">
              Para melhores resultados, utilize imagens em formato **PNG ou SVG** com fundo transparente. 
              O favicon deve ser preferencialmente quadrado. Após alterar as imagens, pode ser necessário 
              recarregar a página (limpar cache) para ver as mudanças refletidas no navegador.
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3 border-b pb-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Settings2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-800">Automação de Deploy & Atualização do PWA</h3>
                <p className="text-xs text-slate-500">Configure o webhook da Vercel para auto-atualizar os aparelhos instalados.</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Vercel Deploy Webhook URL</label>
              <input
                type="text"
                placeholder="https://api.vercel.com/v1/integrations/deploy/..."
                value={vercelUrlInput}
                onChange={(e) => setVercelUrlInput(e.target.value)}
                className="w-full text-sm border rounded-xl px-4 py-3 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono"
              />
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Obtenha esta URL no seu painel da Vercel em: <strong>Settings &gt; Git &gt; Deploy Webhooks</strong> (selecione a branch <code>main</code>). 
                Quando logotipos ou favicon forem modificados, a Supabase invocará esta URL para gerar um novo build do PWA com os novos ícones de forma 100% automática.
              </p>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={() => updateVercelWebhookUrl(vercelUrlInput)}
                className="gap-2 rounded-xl text-xs font-bold font-heading py-2.5 px-4"
              >
                <Save className="h-4 w-4" />
                Salvar Webhook de Deploy
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* TAB: INTEGRAÇÕES IA */}
        <TabsContent value="ia" className="space-y-6">
          {isLoadingAI ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <>
              {/* Security notice */}
              <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5 flex gap-3">
                <AlertCircle className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-blue-800 mb-1">Segurança das credenciais</p>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    As API keys são armazenadas no banco de dados protegido por RLS e acessadas exclusivamente pelo servidor (Edge Function). 
                    Elas <strong>nunca são expostas no frontend</strong> ou transmitidas para o navegador.
                  </p>
                </div>
              </div>

              {/* Preferred Provider */}
              <div className="rounded-2xl border bg-white p-6 shadow-sm space-y-4">
                <h3 className="font-bold text-sm uppercase tracking-wider text-slate-500">Provedor Preferencial</h3>
                <p className="text-xs text-slate-400">Quando ambas as keys estiverem configuradas, este provedor será usado primeiro. O outro será acionado automaticamente como fallback.</p>
                <div className="flex gap-3">
                  {(['openai', 'gemini'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => { handleAIFormChange('preferred_provider', p) }}
                      className={cn(
                        'flex-1 py-3 px-4 rounded-xl border-2 font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-2',
                        aiForm.preferred_provider === p
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-slate-200 text-slate-400 hover:border-slate-300'
                      )}
                    >
                      {p === 'openai' ? '🤖 OpenAI GPT' : '✨ Google Gemini'}
                      {aiForm.preferred_provider === p && <CheckCircle2 className="h-4 w-4" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* OpenAI Card */}
              <div className="rounded-2xl border bg-white p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center text-white text-lg">🤖</div>
                    <div>
                      <h3 className="font-bold text-slate-800">OpenAI GPT</h3>
                      <p className="text-xs text-slate-400">Modelo: gpt-4o-mini · Principal</p>
                    </div>
                  </div>
                  {aiForm.openai_api_key && (
                    <span className="text-[10px] bg-green-100 text-green-700 font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Configurado
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600">API Key</label>
                  <div className="relative">
                    <input
                      id="openai-api-key"
                      type={showOpenAIKey ? 'text' : 'password'}
                      value={aiForm.openai_api_key}
                      onChange={e => handleAIFormChange('openai_api_key', e.target.value)}
                      placeholder="sk-proj-..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-11 text-sm font-mono outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOpenAIKey(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showOpenAIKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Obtenha sua key em <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">platform.openai.com/api-keys</a>
                  </p>
                </div>
              </div>

              {/* Gemini Card */}
              <div className="rounded-2xl border bg-white p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg">✨</div>
                    <div>
                      <h3 className="font-bold text-slate-800">Google Gemini</h3>
                      <p className="text-xs text-slate-400">Modelo: gemini-3.5-flash · Fallback</p>
                    </div>
                  </div>
                  {aiForm.gemini_api_key && (
                    <span className="text-[10px] bg-green-100 text-green-700 font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Configurado
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600">API Key</label>
                  <div className="relative">
                    <input
                      id="gemini-api-key"
                      type={showGeminiKey ? 'text' : 'password'}
                      value={aiForm.gemini_api_key}
                      onChange={e => handleAIFormChange('gemini_api_key', e.target.value)}
                      placeholder="AIza..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-11 text-sm font-mono outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowGeminiKey(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showGeminiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Obtenha sua key em <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">aistudio.google.com/apikey</a>
                  </p>
                </div>
              </div>

              {/* Save button */}
              <div className="flex justify-end">
                <Button
                  onClick={handleSaveAIConfig}
                  disabled={!aiFormDirty || updateAIConfig.isPending}
                  className="gap-2 px-8"
                >
                  {updateAIConfig.isPending
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Salvando...</>
                    : <><Save className="h-4 w-4" /> Salvar Configurações</>}
                </Button>
              </div>
            </>
          )}
        </TabsContent>

        {/* TAB: GERAL */}
        <TabsContent value="geral">
          <div className="rounded-2xl border bg-white p-12 text-center text-muted-foreground flex flex-col items-center justify-center min-h-[300px]">
            <Settings2 className="h-10 w-10 mb-4 text-slate-300" />
            <h3 className="text-lg font-medium mb-2">Configurações Gerais</h3>
            <p className="max-w-md mx-auto text-sm">
              Esta seção permitirá configurar o nome da aplicação, fuso horário padrão e integrações externas.
              Módulo em desenvolvimento.
            </p>
          </div>
        </TabsContent>

        {/* TAB: SEGURANÇA */}
        <TabsContent value="seguranca">
          <div className="rounded-2xl border bg-white p-12 text-center text-muted-foreground flex flex-col items-center justify-center min-h-[300px]">
            <Shield className="h-10 w-10 mb-4 text-slate-300" />
            <h3 className="text-lg font-medium mb-2">Políticas de Segurança</h3>
            <p className="max-w-md mx-auto text-sm">
              Controle de acesso, logs de auditoria e regras de RLS avançadas.
              Módulo em desenvolvimento.
            </p>
          </div>
        </TabsContent>

        {/* TAB: SUPORTE */}
        <TabsContent value="ajuda">
          <div className="rounded-2xl border bg-white p-12 text-center text-muted-foreground flex flex-col items-center justify-center min-h-[300px]">
            <HelpCircle className="h-10 w-10 mb-4 text-slate-300" />
            <h3 className="text-lg font-medium mb-2">Central de Ajuda</h3>
            <p className="max-w-md mx-auto text-sm">
              Consulte a documentação técnica ou entre em contato com o suporte da Studio 4x.
            </p>
            <Button variant="outline" className="mt-6" onClick={() => window.open('https://github.com/studio4x/cardappio/docs', '_blank')}>
              Ver Documentação
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

