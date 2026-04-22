import { useNavigate } from 'react-router-dom'
import { LayoutGrid } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { EmptyState } from '@/components/shared/EmptyState'
import { useCollections } from '@/hooks/recipes/useCollections'

/**
 * CollectionsPage (Screen 18/editorial)
 *
 * Per COMPONENTS_MAP.md: Lists thematic groups of recipes.
 */
export function CollectionsPage() {
  const navigate = useNavigate()
  const { data: collections, isLoading, error, refetch } = useCollections()

  if (isLoading) return <LoadingState message="Carregando coleções..." />
  if (error) return <ErrorState onRetry={() => refetch()} />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Coleções"
        subtitle="Agrupamentos temáticos criados para inspirar sua semana."
      />

      {!collections || collections.length === 0 ? (
        <EmptyState
          icon={<LayoutGrid className="h-8 w-8 text-muted-foreground" />}
          title="Sem coleções ativas"
          description="Fique de olho! Em breve traremos novas coleções exclusivas."
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {collections.map((coll) => (
            <button
              key={coll.id}
              onClick={() => navigate(`/app/colecoes/${coll.slug}`)}
              className="group relative aspect-[21/9] w-full overflow-hidden rounded-2xl border text-left transition-all hover:shadow-lg cursor-pointer"
              style={{ borderColor: 'var(--color-outline-variant)' }}
            >
              {coll.cover_image_url && (
                <img
                  src={coll.cover_image_url}
                  alt={coll.title}
                  className="absolute inset-0 h-full w-full object-cover transition-transform group-hover:scale-105"
                />
              )}
              <div
                className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 flex flex-col justify-end"
              >
                <h3 className="text-xl font-bold text-white mb-1">{coll.title}</h3>
                {coll.description && (
                  <p className="text-sm text-gray-200 line-clamp-1">{coll.description}</p>
                )}
                {coll.is_premium && (
                  <span className="absolute top-4 right-4 rounded-full bg-amber-400 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-950">
                    Premium
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
