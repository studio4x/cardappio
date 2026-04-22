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
import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, Users, Sparkles, Lock, Utensils, ShoppingBasket, Plus, BarChart3, PillIcon } from 'lucide-react'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { useRecipe } from '@/hooks/recipes/useRecipes'
import { FavoriteButton } from '@/components/recipes/FavoriteButton'
import { RecipeIngredients } from '@/components/recipes/RecipeIngredients'
import { RecipeSteps } from '@/components/recipes/RecipeSteps'
import { useAuth } from '@/app/providers/AuthProvider'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function RecipeDetailPage() {
  const { recipeSlug } = useParams()
  const navigate = useNavigate()
  const { data: recipe, isLoading, error, refetch } = useRecipe(recipeSlug)
  const { preferences } = useAuth() 
  const [activeTab, setActiveTab] = useState<'ingredients' | 'instructions'>('ingredients')
  
  const isPremiumUser = preferences?.primary_goal === 'premium' || false
  const isLocked = recipe?.is_premium && !isPremiumUser

  const difficultyLabels = { easy: 'Fácil', medium: 'Médio', hard: 'Difícil' }

  if (isLoading) return <LoadingState message="Carregando receita..." />
  if (error || !recipe) return <ErrorState onRetry={() => refetch()} />

  return (
    <div className="bg-off-white min-h-screen pb-40">
      {/* Top AppBar */}
      <header className="bg-neutral-50/80 backdrop-blur-md border-b flex justify-between items-center px-5 h-16 w-full fixed top-0 z-50 transition-all" style={{ borderColor: 'var(--color-outline-variant)' }}>
        <button 
          onClick={() => navigate(-1)}
          className="active:scale-95 transition-transform hover:bg-neutral-100 p-2 rounded-full"
        >
          <ArrowLeft className="h-5 w-5 text-neutral-500" />
        </button>
        <span className="text-xl font-extrabold tracking-tighter" style={{ color: 'var(--color-primary)' }}>Cardappio</span>
        <FavoriteButton recipeId={recipe.id} />
      </header>

      {/* Main Content */}
      <main className="pt-16">
        {/* Hero Section */}
        <section className="relative w-full aspect-[4/3] md:aspect-[21/9] overflow-hidden">
          {recipe.cover_image_url && (
            <img src={recipe.cover_image_url} alt={recipe.title} className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-6">
            <div className="text-white">
              <span className="inline-block bg-fresh-green text-white text-[10px] uppercase font-bold px-3 py-1 rounded-full mb-2">
                {recipe.category?.name || 'Receita'}
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-white">{recipe.title}</h2>
            </div>
          </div>
        </section>

        {/* Quick Info Bento */}
        <section className="px-5 -mt-8 relative z-10">
          <div className="grid grid-cols-3 gap-0 bg-white rounded-2xl p-4 shadow-sm border overflow-hidden" style={{ borderColor: 'var(--color-outline-variant)' }}>
            <div className="flex flex-col items-center justify-center p-2 border-r" style={{ borderColor: 'var(--color-outline-variant)' }}>
              <Clock className="h-5 w-5 text-fresh-green mb-1" />
              <span className="text-[10px] font-bold text-neutral-400 uppercase">Tempo</span>
              <span className="text-xs font-bold text-on-surface">{recipe.prep_time_minutes} min</span>
            </div>
            <div className="flex flex-col items-center justify-center p-2 border-r" style={{ borderColor: 'var(--color-outline-variant)' }}>
              <Users className="h-5 w-5 text-fresh-green mb-1" />
              <span className="text-[10px] font-bold text-neutral-400 uppercase">Porções</span>
              <span className="text-xs font-bold text-on-surface">{recipe.servings} pps</span>
            </div>
            <div className="flex flex-col items-center justify-center p-2">
              <BarChart3 className="h-5 w-5 text-fresh-green mb-1" />
              <span className="text-[10px] font-bold text-neutral-400 uppercase">Nível</span>
              <span className="text-xs font-bold text-on-surface">{difficultyLabels[recipe.difficulty_level]}</span>
            </div>
          </div>
        </section>

        {/* Toggle Controls */}
        <section className="mt-8 px-5">
          <div className="flex p-1 bg-neutral-100 rounded-xl">
            <button 
              onClick={() => setActiveTab('ingredients')}
              className={cn(
                "flex-1 py-3 rounded-lg text-sm font-bold transition-all",
                activeTab === 'ingredients' ? "bg-white shadow-sm text-primary" : "text-neutral-400"
              )}
            >
              Ingredientes
            </button>
            <button 
              onClick={() => setActiveTab('instructions')}
              className={cn(
                "flex-1 py-3 rounded-lg text-sm font-bold transition-all",
                activeTab === 'instructions' ? "bg-white shadow-sm text-primary" : "text-neutral-400"
              )}
            >
              Passos
            </button>
          </div>
        </section>

        {/* Content Canvas */}
        <div className="mt-6 px-5 max-w-2xl mx-auto">
          {isLocked ? (
            <div 
              className="relative overflow-hidden rounded-[2.5rem] border-2 border-dashed p-10 text-center space-y-6"
              style={{ 
                borderColor: 'var(--color-primary-container)',
                backgroundColor: 'var(--color-surface-container-lowest)' 
              }}
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Lock className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Conteúdo Exclusivo</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Esta receita faz parte do catálogo premium. Assine o **Cardappio Pro** para liberar o conteúdo completo.
                </p>
              </div>
              <Button onClick={() => navigate('/app/assinatura')} className="rounded-full px-8 shadow-lg shadow-primary/20">
                Seja Premium
              </Button>
            </div>
          ) : (
            <div className="space-y-8">
               {activeTab === 'ingredients' ? (
                 <RecipeIngredients ingredients={recipe.ingredients ?? []} />
               ) : (
                 <RecipeSteps steps={recipe.steps ?? []} />
               )}

               {/* Nutrition Info */}
               <div className="bg-surface-container rounded-2xl p-5 border" style={{ borderColor: 'var(--color-outline-variant)' }}>
                 <h3 className="text-sm font-bold mb-4 flex items-center gap-2 uppercase tracking-widest text-on-surface">
                   <PillIcon className="h-4 w-4 text-fresh-green" />
                   Nutrição por Porção
                 </h3>
                 <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'CALORIAS', val: '342 kcal' },
                      { label: 'PROTEÍNA', val: '28g' },
                      { label: 'GORDURAS', val: '18g' },
                      { label: 'CARBOS', val: '12g' }
                    ].map(n => (
                      <div key={n.label} className="bg-white/50 p-3 rounded-xl border border-white">
                        <p className="text-[10px] font-bold text-neutral-400">{n.label}</p>
                        <p className="text-sm font-bold text-primary">{n.val}</p>
                      </div>
                    ))}
                 </div>
               </div>

               {/* Variations / Swaps */}
               {recipe.variations && recipe.variations.length > 0 && (
                 <section 
                   className="rounded-3xl border p-5"
                   style={{ 
                     backgroundColor: 'color-mix(in srgb, var(--color-primary) 5%, transparent)',
                     borderColor: 'var(--color-primary-container)'
                   }}
                 >
                   <div className="flex items-center gap-2 mb-3">
                     <Sparkles className="h-4 w-4 text-primary" />
                     <h3 className="font-bold text-[10px] uppercase tracking-widest text-primary">
                       Trocas e Sugestões
                     </h3>
                   </div>
                   <ul className="space-y-3">
                     {recipe.variations.map((v) => (
                       <li key={v.id} className="text-sm">
                         <strong className="block mb-0.5 text-on-surface">{v.variation_title}</strong>
                         <span className="text-text-secondary">{v.variation_notes}</span>
                       </li>
                     ))}
                   </ul>
                 </section>
               )}
            </div>
          )}
        </div>
      </main>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-md border-t p-5 pb-8 z-50 flex gap-4 transition-all" style={{ borderColor: 'var(--color-outline-variant)' }}>
        <button 
          onClick={() => navigate('/app/semana/nova')}
          className="flex-1 bg-fresh-green text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
        >
          <Plus className="h-5 w-5" />
          Adicionar ao Plano
        </button>
        <button 
          onClick={() => navigate('/app/compras')}
          className="w-14 h-14 border flex items-center justify-center rounded-xl text-neutral-400 active:scale-90 transition-all"
          style={{ borderColor: 'var(--color-outline-variant)' }}
        >
          <ShoppingBasket className="h-6 w-6" />
        </button>
      </div>
    </div>
  )
}
