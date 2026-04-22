import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { Search, ChefHat, Filter } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { EmptyState } from '@/components/shared/EmptyState'
import { useRecipes, useRecipeCategories } from '@/hooks/recipes/useRecipes'
import { useAssignRecipe } from '@/hooks/planning/usePlanning'
import type { Recipe } from '@/types/recipes'
import { cn } from '@/lib/utils'
import { RecipeCard } from '@/components/recipes/RecipeCard'

/**
 * RecipePickerPage (Screen 09/10)
 *
 * Per SCREENS.md and CODEX_CARDAPPIO_APP_SPEC.md:
 * - Grid of recipe cards with filters
 * - If accessed from a planner slot, selecting a recipe assigns it
 * - Search, category filter, difficulty filter
 */
export function RecipePickerPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const slotId = searchParams.get('slot')
  const weekId = searchParams.get('week')
  const isPickerMode = !!slotId && !!weekId

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [difficultyFilter, setDifficultyFilter] = useState<string>('')

  const { data: recipes, isLoading, error, refetch } = useRecipes({
    search: search || undefined,
    categoryId: categoryFilter || undefined,
    difficulty: difficultyFilter || undefined,
  })

  const { data: categories } = useRecipeCategories()
  const assignRecipe = useAssignRecipe()

  const handleSelectRecipe = async (recipe: Recipe) => {
    if (isPickerMode && slotId) {
      try {
        await assignRecipe.mutateAsync({
          slotId,
          recipeId: recipe.id,
        })
        navigate(`/app/semana/${weekId}`, { replace: true })
      } catch (err) {
        console.error('Error assigning recipe:', err)
      }
    } else {
      navigate(`/app/receitas/${recipe.slug}`)
    }
  }

  return (
    <div>
      <PageHeader
        title={isPickerMode ? 'Escolher receita' : 'Receitas'}
        subtitle={isPickerMode ? 'Selecione uma receita para este slot.' : 'Explore receitas para montar sua semana.'}
      />

      {/* Search and filters */}
      <div className="mb-6 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
            style={{ color: 'var(--color-outline)' }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar receitas..."
            className="w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm outline-none transition-colors"
            style={{
              borderColor: 'var(--color-outline-variant)',
              backgroundColor: 'var(--color-surface-container-lowest)',
              color: 'var(--color-on-surface)',
            }}
          />
        </div>

        {/* Filters row */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {/* Category pills */}
          <button
            onClick={() => setCategoryFilter('')}
            className={cn(
              'shrink-0 rounded-full border px-4 py-1.5 text-xs font-medium transition-all cursor-pointer',
            )}
            style={{
              borderColor: !categoryFilter ? 'var(--color-primary)' : 'var(--color-outline-variant)',
              backgroundColor: !categoryFilter
                ? 'color-mix(in srgb, var(--color-primary) 10%, transparent)'
                : 'transparent',
              color: !categoryFilter ? 'var(--color-primary)' : 'var(--color-on-surface-variant)',
            }}
          >
            Todas
          </button>
          {categories?.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className="shrink-0 rounded-full border px-4 py-1.5 text-xs font-medium transition-all cursor-pointer"
              style={{
                borderColor: categoryFilter === cat.id ? 'var(--color-primary)' : 'var(--color-outline-variant)',
                backgroundColor: categoryFilter === cat.id
                  ? 'color-mix(in srgb, var(--color-primary) 10%, transparent)'
                  : 'transparent',
                color: categoryFilter === cat.id ? 'var(--color-primary)' : 'var(--color-on-surface-variant)',
              }}
            >
              {cat.name}
            </button>
          ))}

          {/* Difficulty */}
          <div className="ml-auto flex gap-1">
            {[
              { value: '', label: 'Qualquer' },
              { value: 'easy', label: 'Fácil' },
              { value: 'medium', label: 'Médio' },
              { value: 'hard', label: 'Difícil' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDifficultyFilter(opt.value)}
                className="shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-all cursor-pointer"
                style={{
                  borderColor: difficultyFilter === opt.value ? 'var(--color-secondary)' : 'var(--color-outline-variant)',
                  backgroundColor: difficultyFilter === opt.value
                    ? 'color-mix(in srgb, var(--color-secondary) 10%, transparent)'
                    : 'transparent',
                  color: difficultyFilter === opt.value ? 'var(--color-secondary)' : 'var(--color-on-surface-variant)',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <LoadingState message="Buscando receitas..." />
      ) : error ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !recipes || recipes.length === 0 ? (
        <EmptyState
          icon={<ChefHat className="h-8 w-8" />}
          title="Nenhuma receita encontrada"
          description={search ? 'Tente buscar com outros termos.' : 'Ainda não há receitas publicadas.'}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onClick={() => handleSelectRecipe(recipe)}
              isPickerMode={isPickerMode}
            />
          ))}
        </div>
      )}
    </div>
  )
}


