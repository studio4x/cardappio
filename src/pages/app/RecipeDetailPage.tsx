import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Clock, Users, ChefHat, Sparkles } from 'lucide-react'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { useRecipe } from '@/hooks/recipes/useRecipes'
import { FavoriteButton } from '@/components/recipes/FavoriteButton'

export function RecipeDetailPage() {
  const { recipeSlug } = useParams()
  const { data: recipe, isLoading, error, refetch } = useRecipe(recipeSlug)

  const difficultyLabels = { easy: 'Fácil', medium: 'Médio', hard: 'Difícil' }
  const costLabels = { low: 'Baixo', medium: 'Médio', high: 'Alto' }

  if (isLoading) return <LoadingState message="Carregando receita..." />
  if (error || !recipe) return <ErrorState onRetry={() => refetch()} />

  const sortedIngredients = [...(recipe.ingredients ?? [])].sort((a, b) => a.sort_order - b.sort_order)
  const sortedSteps = [...(recipe.steps ?? [])].sort((a, b) => a.step_number - b.step_number)

  return (
    <div className="mx-auto max-w-2xl pb-12">
      {/* Header / Nav */}
      <div className="flex items-center justify-between mb-6">
        <Link
          to="/app/receitas"
          className="inline-flex items-center gap-1.5 text-sm font-semibold no-underline"
          style={{ color: 'var(--color-primary)' }}
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
        <FavoriteButton recipeId={recipe.id} />
      </div>

      {/* Cover image */}
      <div
        className="relative mb-8 aspect-video overflow-hidden rounded-[2rem] shadow-lg"
        style={{ backgroundColor: 'var(--color-surface-container)' }}
      >
        {recipe.cover_image_url ? (
          <img
            src={recipe.cover_image_url}
            alt={recipe.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ChefHat className="h-16 w-16" style={{ color: 'var(--color-outline)' }} />
          </div>
        )}
      </div>

      {/* Title & meta */}
      <div className="mb-8">
        <h1
          className="mb-3 text-3xl font-extrabold tracking-tight"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-on-surface)' }}
        >
          {recipe.title}
        </h1>
        {recipe.subtitle && (
          <p className="mb-6 text-base leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            {recipe.subtitle}
          </p>
        )}

        {/* Stats bar */}
        <div className="flex flex-wrap items-center gap-2">
          <div
            className="flex items-center gap-2 rounded-2xl bg-surface-container-low px-4 py-2 text-xs font-bold uppercase tracking-wider"
            style={{ color: 'var(--color-on-surface-variant)' }}
          >
            <Clock className="h-4 w-4" style={{ color: 'var(--color-primary)' }} />
            {recipe.prep_time_minutes} min
          </div>
          <div
            className="flex items-center gap-2 rounded-2xl bg-surface-container-low px-4 py-2 text-xs font-bold uppercase tracking-wider"
            style={{ color: 'var(--color-on-surface-variant)' }}
          >
            <Users className="h-4 w-4" style={{ color: 'var(--color-primary)' }} />
            {recipe.servings} porções
          </div>
          <div
            className="flex items-center gap-2 rounded-2xl bg-surface-container-low px-4 py-2 text-xs font-bold uppercase tracking-wider"
            style={{ color: 'var(--color-on-surface-variant)' }}
          >
            {difficultyLabels[recipe.difficulty_level]}
          </div>
        </div>
      </div>

      {/* Variations / Swaps (Lote 2/5 Retention) */}
      {recipe.variations && recipe.variations.length > 0 && (
        <section className="mb-10">
          <div 
            className="rounded-3xl border p-5"
            style={{ 
              backgroundColor: 'color-mix(in srgb, var(--color-primary) 5%, transparent)',
              borderColor: 'var(--color-primary-container)'
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4" style={{ color: 'var(--color-primary)' }} />
              <h3 className="font-bold text-sm uppercase tracking-widest" style={{ color: 'var(--color-primary)' }}>
                Trocas e Sugestões
              </h3>
            </div>
            <ul className="space-y-3">
              {recipe.variations.map((v) => (
                <li key={v.id} className="text-sm">
                  <strong className="block mb-0.5" style={{ color: 'var(--color-on-surface)' }}>{v.variation_title}</strong>
                  <span style={{ color: 'var(--color-text-secondary)' }}>{v.variation_notes}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Ingredients */}
      <section className="mb-10">
        <h2
          className="mb-4 text-xl font-bold"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-on-surface)' }}
        >
          Ingredientes
        </h2>
        <div
          className="rounded-[2rem] border p-6"
          style={{
            backgroundColor: 'var(--color-surface-container-lowest)',
            borderColor: 'var(--color-outline-variant)',
          }}
        >
          {sortedIngredients.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Nenhum ingrediente cadastrado.
            </p>
          ) : (
            <ul className="space-y-4">
              {sortedIngredients.map((ing) => (
                <li key={ing.id} className="flex items-start gap-3 text-base">
                  <div
                    className="mt-2 h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                  />
                  <div>
                    <span className="font-medium" style={{ color: 'var(--color-on-surface)' }}>{ing.name}</span>
                    {ing.quantity_label && (
                      <span className="ml-1" style={{ color: 'var(--color-text-secondary)' }}>
                        — {ing.quantity_label}
                      </span>
                    )}
                    {ing.is_optional && (
                      <span className="ml-2 text-sm italic" style={{ color: 'var(--color-outline)' }}>
                        (opcional)
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Steps */}
      <section className="mb-10">
        <h2
          className="mb-6 text-xl font-bold"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-on-surface)' }}
        >
          Modo de preparo
        </h2>
        {sortedSteps.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Nenhum passo cadastrado.
          </p>
        ) : (
          <div className="space-y-8">
            {sortedSteps.map((step) => (
              <div key={step.id} className="flex gap-6">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-black text-white"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  {step.step_number}
                </div>
                <p className="text-base leading-relaxed pt-0.5" style={{ color: 'var(--color-on-surface)' }}>
                  {step.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Notes */}
      {recipe.notes && (
        <section
          className="rounded-[2rem] border p-6"
          style={{
            backgroundColor: 'var(--color-surface-container-low)',
            borderColor: 'var(--color-outline-variant)',
          }}
        >
          <h3 className="mb-2 text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--color-outline)' }}>
            Dicas Adicionais
          </h3>
          <p className="text-base leading-relaxed italic" style={{ color: 'var(--color-on-surface-variant)' }}>
            "{recipe.notes}"
          </p>
        </section>
      )}
    </div>
  )
}
