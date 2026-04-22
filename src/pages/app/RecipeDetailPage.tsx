import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, Users, Sparkles, Lock } from 'lucide-react'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { useRecipe } from '@/hooks/recipes/useRecipes'
import { FavoriteButton } from '@/components/recipes/FavoriteButton'
import { RecipeHero } from '@/components/recipes/RecipeHero'
import { RecipeIngredients } from '@/components/recipes/RecipeIngredients'
import { RecipeSteps } from '@/components/recipes/RecipeSteps'
import { useAuth } from '@/app/providers/AuthProvider'
import { Button } from '@/components/ui/button'

/**
 * RecipeDetailPage
 * 
 * Displays full recipe information.
 * Implements Premium Guard for restricted content.
 * Refactored into modular components for audit compliance.
 */
export function RecipeDetailPage() {
  const { recipeSlug } = useParams()
  const navigate = useNavigate()
  const { data: recipe, isLoading, error, refetch } = useRecipe(recipeSlug)
  const { preferences } = useAuth() 
  
  // NOTE: Simple premium check for Phase A validation.
  // In a real production setup, this would be validated by the API/RLS as well.
  const isPremiumUser = preferences?.primary_goal === 'premium' || false // Placeholder logic
  const isLocked = recipe?.is_premium && !isPremiumUser

  const difficultyLabels = { easy: 'Fácil', medium: 'Médio', hard: 'Difícil' }

  if (isLoading) return <LoadingState message="Carregando receita..." />
  if (error || !recipe) return <ErrorState onRetry={() => refetch()} />

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

      <RecipeHero 
        title={recipe.title} 
        subtitle={recipe.subtitle} 
        coverImageUrl={recipe.cover_image_url} 
      />

      {/* Stats bar */}
      <div className="flex flex-wrap items-center gap-2 mb-8">
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

      {/* PREMIUM GUARD OVERLAY */}
      {isLocked ? (
        <div 
          className="relative overflow-hidden rounded-[2.5rem] border-2 border-dashed p-10 text-center space-y-6"
          style={{ 
            borderColor: 'var(--color-primary-container)',
            backgroundColor: 'var(--color-surface-container-lowest)' 
          }}
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold">Conteúdo Exclusivo</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Esta receita faz parte do catálogo premium. Assine o **Cardappio Pro** para liberar o modo de preparo e lista de ingredientes.
            </p>
          </div>
          <Button onClick={() => navigate('/app/perfil')} className="rounded-full px-8 shadow-lg shadow-primary/20">
            Seja Premium
          </Button>
        </div>
      ) : (
        <>
          {/* Variations / Swaps */}
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

          <RecipeIngredients ingredients={recipe.ingredients ?? []} />
          <RecipeSteps steps={recipe.steps ?? []} />

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
        </>
      )}
    </div>
  )
}
