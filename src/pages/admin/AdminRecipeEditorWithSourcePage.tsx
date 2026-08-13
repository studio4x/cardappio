import { useCallback, useEffect, useState } from 'react'
import { ExternalLink, Link2, Loader2, Sparkles } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { AdminRecipeEditorPage } from '@/pages/admin/AdminRecipeEditorPage'
import { toast } from 'sonner'

interface RecipeSource {
  source_url: string
  canonical_url: string | null
  imported_at: string | null
}

interface CoverGeneration {
  request_id: string
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'skipped'
  attempt_count: number
  completed_at?: string | null
  image_url?: string | null
  last_error_code?: string | null
  last_error_message?: string | null
}

interface AdminMeta {
  source: RecipeSource | null
  has_cover: boolean
  cover_image_url: string | null
  cover_generation: CoverGeneration | null
}

export function AdminRecipeEditorWithSourcePage() {
  const { id } = useParams()
  const [meta, setMeta] = useState<AdminMeta | null>(null)
  const [loadingMeta, setLoadingMeta] = useState(Boolean(id))
  const [requestingCover, setRequestingCover] = useState(false)

  const loadMeta = useCallback(async () => {
    if (!id) {
      setLoadingMeta(false)
      return
    }

    try {
      const { data, error } = await supabase.functions.invoke('recipe-automation-admin', {
        body: { action: 'get_recipe_source', recipe_id: id },
      })
      if (error) throw error
      if (data?.ok) {
        setMeta({
          source: data.source || null,
          has_cover: data.has_cover === true,
          cover_image_url: data.cover_image_url || null,
          cover_generation: data.cover_generation || null,
        })
      }
    } catch (error) {
      console.warn('Não foi possível carregar os metadados administrativos da receita.', error)
    } finally {
      setLoadingMeta(false)
    }
  }, [id])

  useEffect(() => { loadMeta() }, [loadMeta])

  useEffect(() => {
    if (!['pending', 'processing'].includes(meta?.cover_generation?.status || '')) return
    const timer = window.setInterval(() => loadMeta(), 10_000)
    return () => window.clearInterval(timer)
  }, [meta?.cover_generation?.status, loadMeta])

  const requestCover = async () => {
    if (!id || meta?.has_cover) return
    try {
      setRequestingCover(true)
      const { data, error } = await supabase.functions.invoke('recipe-automation-admin', {
        body: { action: 'request_cover_generation', recipe_id: id, force_regenerate: false },
      })
      if (error) throw error
      if (!data?.ok) throw new Error(data?.error?.message || 'Não foi possível solicitar a capa.')
      if (data?.result?.accepted === false && data?.result?.reason === 'already_queued') {
        toast.info('A capa desta receita já está na fila.')
      } else {
        toast.success('Geração da capa adicionada à fila.')
      }
      await loadMeta()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível solicitar a capa.')
    } finally {
      setRequestingCover(false)
    }
  }

  const coverBusy = ['pending', 'processing'].includes(meta?.cover_generation?.status || '')

  return (
    <div className="space-y-4">
      {(loadingMeta || meta?.source || (!meta?.has_cover && id)) && (
        <div className="mx-auto grid w-full max-w-4xl grid-cols-1 gap-3 lg:grid-cols-2">
          {(loadingMeta || meta?.source) && (
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 px-5 py-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-xl bg-white p-2 text-indigo-600 shadow-sm">
                  {loadingMeta ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-black uppercase tracking-wider text-indigo-500">URL original da receita</p>
                  {loadingMeta ? (
                    <p className="mt-1 text-sm text-slate-500">Carregando origem...</p>
                  ) : meta?.source ? (
                    <>
                      <a href={meta.source.source_url} target="_blank" rel="noopener noreferrer" className="mt-1 block break-all text-sm font-semibold text-indigo-700 underline decoration-indigo-300 underline-offset-2 hover:text-indigo-900">
                        {meta.source.source_url}
                      </a>
                      <a href={meta.source.source_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700">
                        Abrir origem <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          )}

          {!loadingMeta && !meta?.has_cover && id && (
            <div className="rounded-2xl border border-amber-100 bg-amber-50/70 px-5 py-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-xl bg-white p-2 text-amber-600 shadow-sm"><Sparkles className="h-4 w-4" /></div>
                <div className="flex-1">
                  <p className="text-[11px] font-black uppercase tracking-wider text-amber-600">Imagem de capa</p>
                  <p className="mt-1 text-sm font-semibold text-slate-700">
                    {coverBusy
                      ? meta?.cover_generation?.status === 'processing' ? 'Capa sendo gerada pela automação.' : 'Capa aguardando processamento.'
                      : meta?.cover_generation?.status === 'failed' ? 'A última tentativa falhou. Você pode solicitar novamente.' : 'Esta receita ainda não possui imagem de capa.'}
                  </p>
                  {meta?.cover_generation?.last_error_message && meta.cover_generation.status === 'failed' && (
                    <p className="mt-1 text-xs text-red-600">{meta.cover_generation.last_error_message}</p>
                  )}
                  <Button type="button" size="sm" variant="outline" disabled={coverBusy || requestingCover} onClick={requestCover} className="mt-3 rounded-full border-amber-200 bg-white text-amber-700 hover:bg-amber-50">
                    {requestingCover || coverBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    {coverBusy ? 'Aguardando capa' : meta?.cover_generation?.status === 'failed' ? 'Tentar gerar novamente' : 'Gerar capa com IA'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <AdminRecipeEditorPage />
    </div>
  )
}
