import { useState, useCallback } from 'react'
import { Search, Link2, X, Loader2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { cn } from '@/lib/utils'

interface RecipeLinkResult {
  id: string
  slug: string
  title: string
  category?: { name: string } | null
}

interface RecipeLinkModalProps {
  /** Whether the modal is visible */
  open: boolean
  /** Called when the user closes without selecting */
  onClose: () => void
  /** Called when the user picks a recipe */
  onSelect: (recipe: RecipeLinkResult) => void
  /** Optional title override */
  title?: string
}

/**
 * RecipeLinkModal
 *
 * Reusable modal that lets admins search for a recipe and pick one
 * to be referenced (as a link in an ingredient or in rich text).
 */
export function RecipeLinkModal({
  open,
  onClose,
  onSelect,
  title = 'Vincular Receita',
}: RecipeLinkModalProps) {
  const [searchInput, setSearchInput] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['recipe-link-search', searchInput],
    queryFn: async () => {
      let query = supabase
        .from('recipes')
        .select('id, slug, title, category:recipe_categories(name)')
        .order('title')
        .limit(20)

      if (searchInput.trim()) {
        query = query.ilike('title', `%${searchInput.trim()}%`)
      }

      const { data, error } = await query
      if (error) throw error
      // Supabase returns joined relations as arrays in some contexts; normalise here.
      return ((data ?? []) as any[]).map((row) => ({
        id: row.id as string,
        slug: row.slug as string,
        title: row.title as string,
        category: Array.isArray(row.category)
          ? (row.category[0] ?? null)
          : row.category ?? null,
      })) as RecipeLinkResult[]
    },
    enabled: open,
  })

  const handleSelect = useCallback(
    (recipe: RecipeLinkResult) => {
      onSelect(recipe)
      setSearchInput('')
    },
    [onSelect]
  )

  const handleClose = useCallback(() => {
    setSearchInput('')
    onClose()
  }, [onClose])

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2 text-slate-800">
            <Link2 className="h-4 w-4 text-primary" />
            <span className="font-bold text-sm">{title}</span>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search input */}
        <div className="px-4 pt-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              autoFocus
              type="text"
              placeholder="Buscar receita pelo título..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-slate-50"
            />
          </div>
        </div>

        {/* Results */}
        <div className="max-h-72 overflow-y-auto px-4 pb-4 space-y-1 mt-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 gap-2 text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Buscando...</span>
            </div>
          ) : !data || data.length === 0 ? (
            <p className="text-center text-sm text-slate-400 italic py-8">
              Nenhuma receita encontrada.
            </p>
          ) : (
            data.map((recipe) => (
              <button
                key={recipe.id}
                type="button"
                onClick={() => handleSelect(recipe)}
                className={cn(
                  'w-full flex items-center gap-3 text-left px-3 py-2.5 rounded-xl transition-all',
                  'hover:bg-primary/5 hover:border-primary/20 border border-transparent',
                  'group'
                )}
              >
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Link2 className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-primary transition-colors">
                    {recipe.title}
                  </p>
                  {recipe.category?.name && (
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">
                      {recipe.category.name}
                    </p>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </>
  )
}
