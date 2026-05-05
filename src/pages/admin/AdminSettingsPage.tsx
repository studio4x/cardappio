import { useState } from 'react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { LoadingState } from '@/components/shared/LoadingState'
import { useAdminSettings } from '@/hooks/admin/useAdminSettings'
import { Image as ImageIcon, Upload, Save, Trash2, Palette, Shield, Settings2, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export function AdminSettingsPage() {
  const { loading, visualIdentity, updateVisualIdentity, uploadAsset } = useAdminSettings()
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('visual')

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo_dark_url' | 'logo_light_url' | 'favicon_url') => {
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

  const handleRemoveAsset = async (type: 'logo_dark_url' | 'logo_light_url' | 'favicon_url') => {
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

          <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-6">
            <h4 className="font-bold text-amber-800 text-sm mb-2">Dica de Design</h4>
            <p className="text-xs text-amber-700 leading-relaxed">
              Para melhores resultados, utilize imagens em formato **PNG ou SVG** com fundo transparente. 
              O favicon deve ser preferencialmente quadrado. Após alterar as imagens, pode ser necessário 
              recarregar a página (limpar cache) para ver as mudanças refletidas no navegador.
            </p>
          </div>
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

