import { useParams, useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { RecipeCard } from '@/components/recipes/RecipeCard'
import { useCollection } from '@/hooks/recipes/useCollections'

/**
 * CollectionDetailPage
 *
 * Shows recipes belonging to a specific editorial collection.
 */
export function CollectionDetailPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { data: collection, isLoading, error, refetch } = useCollection(slug)

  if (isLoading) return <LoadingState message="Carregando coleção..." />
  if (error) return <ErrorState onRetry={() => refetch()} />
  if (!collection) return <ErrorState message="Coleção não encontrada." onRetry={() => navigate('/app/colecoes')} />

  return (
    <div className="space-y-6">
      <div className="relative -mx-4 -mt-4 sm:mx-0 sm:mt-0 sm:rounded-3xl overflow-hidden aspect-[21/9] mb-8">
        {collection.cover_image_url && (
          <img
            src={collection.cover_image_url}
            alt={collection.title}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-6 flex flex-col justify-end">
          <h1 className="text-2xl font-bold text-white mb-2">{collection.title}</h1>
          <p className="text-gray-200 max-w-2xl">{collection.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {collection.recipes?.map((recipe: any) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            onClick={() => navigate(`/app/receitas/${recipe.slug}`)}
          />
        ))}
      </div>
    </div>
  )
}
