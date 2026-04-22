import { Link, useNavigate } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { EmptyState } from '@/components/shared/EmptyState'
import { RecipeCard } from '@/components/recipes/RecipeCard'
import { useFavorites } from '@/hooks/recipes/useFavorites'

/**
 * FavoritesPage (Screen 13)
 *
 * Per SCREENS.md and COMPONENTS_MAP.md:
 * - Lists user's favorite recipes
 * - Quick access to cooking or planning
 */
export function FavoritesPage() {
  const navigate = useNavigate()
  const { data: favorites, isLoading, error, refetch } = useFavorites()

  if (isLoading) return <LoadingState message="Carregando seus favoritos..." />
  if (error) return <ErrorState onRetry={() => refetch()} />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Meus Favoritos"
        subtitle="Suas receitas preferidas para facilitar o planejamento."
      />

      {!favorites || favorites.length === 0 ? (
        <EmptyState
          icon={<Heart className="h-8 w-8 text-muted-foreground" />}
          title="Nenhum favorito ainda"
          description="Salve as receitas que você mais gosta para encontrá-las rapidamente aqui."
          action={
            <Link
              to="/app/receitas"
              className="inline-flex items-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition-all hover:opacity-90 no-underline"
            >
              Explorar receitas
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onClick={() => navigate(`/app/receitas/${recipe.slug}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
