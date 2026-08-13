import { useEffect, useState } from 'react'
import { ExternalLink, Link2, Loader2 } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { AdminRecipeEditorPage } from '@/pages/admin/AdminRecipeEditorPage'

interface RecipeSource {
  source_url: string
  canonical_url: string | null
  imported_at: string | null
}

export function AdminRecipeEditorWithSourcePage() {
  const { id } = useParams()
  const [source, setSource] = useState<RecipeSource | null>(null)
  const [loadingSource, setLoadingSource] = useState(Boolean(id))

  useEffect(() => {
    let active = true

    const loadSource = async () => {
      if (!id) {
        setLoadingSource(false)
        return
      }

      try {
        const { data, error } = await supabase.functions.invoke('recipe-automation-admin', {
          body: {
            action: 'get_recipe_source',
            recipe_id: id,
          },
        })

        if (error) throw error

        if (active && data?.ok && data?.source?.source_url) {
          setSource(data.source as RecipeSource)
        }
      } catch (error) {
        // A origem é informação administrativa auxiliar e não deve impedir a edição.
        console.warn('Não foi possível carregar a URL original da receita.', error)
      } finally {
        if (active) setLoadingSource(false)
      }
    }

    loadSource()

    return () => {
      active = false
    }
  }, [id])

  return (
    <div className="space-y-4">
      {(loadingSource || source) && (
        <div className="mx-auto w-full max-w-4xl">
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 px-5 py-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-xl bg-white p-2 text-indigo-600 shadow-sm">
                {loadingSource ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Link2 className="h-4 w-4" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-black uppercase tracking-wider text-indigo-500">
                  URL original da receita
                </p>

                {loadingSource ? (
                  <p className="mt-1 text-sm text-slate-500">Carregando origem...</p>
                ) : source ? (
                  <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <a
                      href={source.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-w-0 break-all text-sm font-semibold text-indigo-700 underline decoration-indigo-300 underline-offset-2 hover:text-indigo-900"
                    >
                      {source.source_url}
                    </a>
                    <a
                      href={source.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex shrink-0 items-center gap-1.5 text-xs font-bold text-indigo-700 hover:text-indigo-900"
                    >
                      Abrir origem
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                ) : null}

                {!loadingSource && source && (
                  <p className="mt-2 text-[11px] text-slate-500">
                    Informação administrativa da importação. Não é exibida na página pública da receita.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <AdminRecipeEditorPage />
    </div>
  )
}
