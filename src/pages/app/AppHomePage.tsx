import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { CalendarDays, Plus, ShoppingCart, ChefHat, Sparkles, BookOpen, Heart, ArrowRight, ChevronRight, Star, Utensils, Clock, PiggyBank, CheckSquare as ListChecks, Loader2, Crown, Lock } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { LoadingState } from '@/components/shared/LoadingState'
import { useAuth } from '@/app/providers/AuthProvider'
import { useActiveWeek } from '@/hooks/planning/usePlanning'
import { useCollections, useEditorialNotices } from '@/hooks/recipes/useCollections'
import { DAY_LABELS, type DayOfWeek } from '@/lib/constants/calendar'
import { useShoppingList, useToggleShoppingItem, useGenerateShoppingList } from '@/hooks/shopping/useShopping'
import { useFavorites, useToggleFavorite } from '@/hooks/recipes/useFavorites'
import { useRecipes } from '@/hooks/recipes/useRecipes'
import { toast } from 'sonner'
import type { Recipe } from '@/types/recipes'

export function AppHomePage() {
  const { user, preferences } = useAuth()
  const isPremiumUser = !!(user?.subscription_tier && user.subscription_tier !== 'free' && user.subscription_tier !== 'plano-gratuito')
  const { data: activeWeek, isLoading: weekLoading } = useActiveWeek()
  const { data: notices } = useEditorialNotices()
  
  // Shopping list hooks
  const { data: shoppingList, isLoading: listLoading } = useShoppingList(activeWeek?.id)
  const toggleShoppingItem = useToggleShoppingItem()
  const generateList = useGenerateShoppingList()

  // Favorites & Recommended hooks
  const { data: favorites, isLoading: favsLoading } = useFavorites()
  const { data: recommendedRecipesData, isLoading: recsLoading } = useRecipes({ pageSize: 12 }) // Load more to allow filtering
  const toggleFavorite = useToggleFavorite()

  // Planning Assistant calculations
  const plannedDaysCount = useMemo(() => {
    if (!activeWeek?.days) return 0
    return activeWeek.days.filter(day => 
      day.slots?.some(slot => slot.recipe_id)
    ).length
  }, [activeWeek?.days])

  const targetPlanDays = preferences?.default_plan_days || 5

  const dietaryWarnings = useMemo(() => {
    if (!activeWeek?.days || !preferences?.dietary_restrictions?.length) return []

    const warnings: { recipeId: string; recipeTitle: string; recipeSlug: string; restriction: string }[] = []
    
    activeWeek.days.forEach(day => {
      day.slots?.forEach(slot => {
        const recipe = slot.recipe
        if (!recipe) return
        
        const textToSearch = [
          recipe.title,
          recipe.notes || '',
          recipe.usage_context || '',
          recipe.category?.name || ''
        ].join(' ').toLowerCase()

        preferences.dietary_restrictions.forEach(restriction => {
          let complies = true
          if (restriction === 'sem_gluten') {
            complies = textToSearch.includes('glúten') || textToSearch.includes('gluten') || textToSearch.includes('fit') || textToSearch.includes('saudável') || textToSearch.includes('sem glúten') || textToSearch.includes('sem gluten')
          } else if (restriction === 'sem_lactose') {
            complies = textToSearch.includes('lactose') || textToSearch.includes('zero lactose') || textToSearch.includes('sem lactose') || textToSearch.includes('vegano')
          } else if (restriction === 'vegetariano') {
            complies = textToSearch.includes('vegetariano') || textToSearch.includes('veggie') || textToSearch.includes('salada') || textToSearch.includes('vegano')
          } else if (restriction === 'vegano') {
            complies = textToSearch.includes('vegano') || textToSearch.includes('vegan')
          } else if (restriction === 'low_carb') {
            complies = textToSearch.includes('low carb') || textToSearch.includes('proteico') || textToSearch.includes('salada')
          }

          if (!complies) {
            const alreadyAdded = warnings.some(w => w.recipeId === recipe.id && w.restriction === restriction)
            if (!alreadyAdded) {
              warnings.push({
                recipeId: recipe.id,
                recipeTitle: recipe.title,
                recipeSlug: recipe.slug,
                restriction
              })
            }
          }
        })
      })
    })

    return warnings
  }, [activeWeek?.days, preferences?.dietary_restrictions])

  const getRestrictionLabel = (restriction: string) => {
    const map: Record<string, string> = {
      sem_gluten: 'Sem Glúten',
      sem_lactose: 'Sem Lactose',
      vegetariano: 'Vegetariano',
      vegano: 'Vegano',
      low_carb: 'Low Carb'
    }
    return map[restriction] || restriction
  }

  const totalMealsCount = useMemo(() => {
    if (!activeWeek?.days) return 0
    return activeWeek.days.reduce((acc, day) => 
      acc + (day.slots?.filter(s => s.recipe_id).length || 0), 0
    )
  }, [activeWeek?.days])

  const estimatedPortions = totalMealsCount * (preferences?.household_size || 1)

  const greetingName = user?.full_name ? user.full_name.split(' ')[0] : 'usuário'
  const greeting = `Olá, ${greetingName}! 👋`

  const latestNotice = notices?.[0]

  // Detect current day
  const daysOfWeekMap: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const todayName = daysOfWeekMap[new Date().getDay()]

  const restrictions = useMemo(() => preferences?.dietary_restrictions || [], [preferences])

  const filteredRecipes = useMemo(() => {
    if (!recommendedRecipesData?.recipes) return []
    if (restrictions.length === 0) return recommendedRecipesData.recipes
    
    return recommendedRecipesData.recipes.filter(recipe => {
      const textToSearch = [
        recipe.title,
        recipe.notes,
        recipe.usage_context,
        recipe.category?.name
      ].join(' ').toLowerCase()

      return restrictions.every(restriction => {
        if (restriction === 'sem_gluten') {
          return textToSearch.includes('glúten') || textToSearch.includes('gluten') || textToSearch.includes('fit') || textToSearch.includes('saudável')
        }
        if (restriction === 'sem_lactose') {
          return textToSearch.includes('lactose') || textToSearch.includes('zero lactose')
        }
        if (restriction === 'vegetariano') {
          return textToSearch.includes('vegetariano') || textToSearch.includes('veggie') || textToSearch.includes('salada')
        }
        if (restriction === 'vegano') {
          return textToSearch.includes('vegano') || textToSearch.includes('vegan')
        }
        if (restriction === 'low_carb') {
          return textToSearch.includes('low carb') || textToSearch.includes('proteico')
        }
        return true
      })
    })
  }, [recommendedRecipesData?.recipes, restrictions])

  const hasFavorites = favorites && favorites.length > 0
  const displayRecipes: Recipe[] = hasFavorites 
    ? (favorites.slice(0, 3) as Recipe[]) 
    : (filteredRecipes.slice(0, 3))

  const sectionTitle = hasFavorites 
    ? "Inspirado nos seus Favoritos" 
    : restrictions.length > 0
      ? `Recomendadas para Dieta ${restrictions.map(r => r === 'sem_gluten' ? 'Sem Glúten' : r === 'sem_lactose' ? 'Sem Lactose' : r.replace('_', ' ')).join(', ')}`
      : "Receitas Recomendadas"

  const getDifficultyLabel = (difficulty?: string) => {
    if (!difficulty) return 'Fácil'
    const map: Record<string, string> = {
      easy: 'Fácil',
      medium: 'Médio',
      hard: 'Difícil',
    }
    return map[difficulty.toLowerCase()] || difficulty
  }

  const getCostLabel = (cost?: string) => {
    if (!cost) return 'Econômico'
    const map: Record<string, string> = {
      low: 'Econômico',
      medium: 'Moderado',
      high: 'Premium',
    }
    return map[cost.toLowerCase()] || cost
  }

  const isRecipeFavorite = (recipeId: string) => {
    return favorites?.some((fav: any) => fav.id === recipeId) || false
  }

  const handleGenerateList = async () => {
    if (!activeWeek?.id) return
    try {
      await generateList.mutateAsync(activeWeek.id)
      toast.success('Lista de compras gerada com sucesso!')
    } catch (err: any) {
      toast.error('Erro ao gerar lista de compras: ' + (err.message || 'Erro desconhecido'))
    }
  }

  return (
    <div className="pb-8">
      {/* Welcome Section */}
      <section className="mb-10">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1 block">Dashboard</span>
            <h2 className="text-3xl font-bold text-on-surface">{greeting}</h2>
            <p className="text-text-secondary mt-1">Organize seu cardápio da semana de forma rápida e prática.</p>
            
            {preferences && (
              <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-bold">
                <span className="bg-orange-50/80 text-orange-700 px-3 py-1.5 rounded-xl border border-orange-100/60 flex items-center gap-1.5 shadow-sm">
                  <Utensils className="h-3.5 w-3.5" />
                  Cozinhando para {preferences.household_size} {preferences.household_size === 1 ? 'pessoa' : 'pessoas'}
                </span>
                <span className="bg-emerald-50/80 text-emerald-700 px-3 py-1.5 rounded-xl border border-emerald-100/60 flex items-center gap-1.5 shadow-sm">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Planejando {preferences.default_plan_days} dias/semana
                </span>
                <span className="bg-blue-50/80 text-blue-700 px-3 py-1.5 rounded-xl border border-blue-100/60 flex items-center gap-1.5 shadow-sm">
                  <ChefHat className="h-3.5 w-3.5" />
                  Refeições: {preferences.default_meal_modes?.map(m => m === 'lunch' ? 'Almoço' : m === 'dinner' ? 'Jantar' : m).join(' e ')}
                </span>
              </div>
            )}
          </div>
          <Link
            to={activeWeek ? `/app/semana/${activeWeek.id}` : "/app/semana/nova"}
            className="bg-fresh-green text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-fresh-green/20 flex items-center gap-2 active:scale-95 transition-transform duration-200 no-underline whitespace-nowrap self-start"
            style={{ backgroundColor: 'var(--color-fresh-green)' }}
          >
            <CalendarDays className="h-5 w-5" />
            Criar/Editar Semana
          </Link>
        </div>
      </section>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-10">
        {/* Week Summary Card */}
        <div 
          className="col-span-12 bg-white border rounded-3xl p-6 shadow-sm overflow-hidden"
          style={{ borderColor: 'var(--color-outline-variant)' }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              Resumo da Semana
            </h3>
            {activeWeek && (
              <Link to={`/app/semana/${activeWeek.id}`} className="text-xs font-bold text-primary hover:underline no-underline">
                Ver todos
              </Link>
            )}
          </div>

          {!activeWeek && !weekLoading ? (
             <div className="py-8 text-center bg-surface-container-low rounded-2xl border-2 border-dashed border-outline-variant">
                <p className="text-sm font-medium text-text-secondary mb-3">Você ainda não planejou sua semana.</p>
                <Link to="/app/semana/nova" className="text-xs font-bold text-primary underline">Começar planejamento</Link>
             </div>
          ) : weekLoading ? (
            <div className="h-24 animate-pulse bg-slate-100 rounded-2xl" />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
              {[...(activeWeek?.days ?? [])]
                .sort((a, b) => a.sort_order - b.sort_order)
                .slice(0, 7)
                .map((day) => {
                  const filledCount = (day.slots ?? []).filter(s => s.recipe_id).length
                  const isToday = day.day_of_week === todayName
                  return (
                    <div 
                      key={day.id} 
                      className={`p-4 rounded-2xl border flex flex-col gap-2 transition-all hover:bg-surface-container-low ${
                        isToday ? 'ring-2 ring-primary ring-offset-2' : ''
                      }`}
                      style={{ 
                        backgroundColor: 'var(--color-surface)',
                        borderColor: 'var(--color-outline-variant)'
                      }}
                    >
                      <span className="text-[10px] font-bold text-text-secondary uppercase flex items-center justify-between">
                        <span>{DAY_LABELS[day.day_of_week as DayOfWeek].substring(0, 3)}</span>
                        {isToday && <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase">Hoje</span>}
                      </span>
                      <div className="h-1 bg-primary w-full rounded-full opacity-60"></div>
                      <p className="text-xs font-bold truncate mt-1">
                        {filledCount > 0 ? `${filledCount} Ref.` : "Vazio"}
                      </p>
                    </div>
                  )
                })}
            </div>
          )}
        </div>
        <div 
          className="col-span-12 lg:col-span-4 bg-white border rounded-3xl p-6 shadow-sm flex flex-col justify-between"
          style={{ borderColor: 'var(--color-outline-variant)' }}
        >
          <div>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <ChefHat className="h-5 w-5 text-primary" />
              Explorar Cardápio
            </h3>
            
            {recsLoading ? (
              <div className="space-y-3 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 bg-slate-100 rounded-xl" />
                ))}
              </div>
            ) : !recommendedRecipesData?.recipes || recommendedRecipesData.recipes.length === 0 ? (
              <div className="py-8 text-center bg-surface-container-low rounded-2xl border-2 border-dashed border-outline-variant">
                <p className="text-sm font-medium text-text-secondary">Nenhuma receita recomendada disponível.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recommendedRecipesData.recipes.slice(0, 3).map((recipe) => (
                  <Link 
                    key={recipe.id}
                    to={`/app/receitas/${recipe.slug}`}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 no-underline text-on-surface"
                  >
                    <div className="h-12 w-12 rounded-lg overflow-hidden shrink-0 bg-slate-100">
                      {recipe.cover_image_url ? (
                        <img src={recipe.cover_image_url} alt={recipe.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-slate-300">
                          <ChefHat className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold truncate flex items-center gap-1.5">
                        {recipe.title}
                        {recipe.is_premium && (
                          <span className="inline-flex items-center gap-0.5 rounded bg-amber-400 px-1 py-0.2 text-[8px] font-black uppercase text-amber-950">
                            Pro
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-text-secondary flex items-center gap-2 mt-0.5">
                        <span>{recipe.prep_time_minutes} min</span>
                        <span>•</span>
                        <span className="capitalize">{getDifficultyLabel(recipe.difficulty_level)}</span>
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </div>
          
          <Link 
            to="/app/receitas"
            className="w-full mt-6 bg-primary text-white font-bold text-sm py-3 px-4 rounded-xl text-center no-underline shadow-md shadow-primary/10 hover:bg-primary/95 active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            Acessar Cardápio Completo
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Quick Shopping List Card */}
        <div 
          className="col-span-12 lg:col-span-4 bg-white border rounded-3xl p-6 shadow-sm relative overflow-hidden flex flex-col justify-between"
          style={{ backgroundColor: 'var(--color-surface-container-highest)', borderColor: 'var(--color-outline-variant)' }}
        >
          <div className="absolute top-0 right-0 p-4 opacity-10">
             <ShoppingCart className="h-24 w-24 text-secondary rotate-12" />
          </div>
          <div>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 relative z-10">
              <ListChecks className="h-5 w-5 text-secondary" />
              Lista de Compras
            </h3>
            
            {listLoading ? (
              <div className="space-y-3 relative z-10 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-11 bg-white/40 border border-white/50 rounded-xl" />
                ))}
              </div>
            ) : !activeWeek ? (
              <div className="py-6 text-center bg-white/30 rounded-2xl border border-white/40 relative z-10 flex flex-col justify-center items-center">
                <p className="text-xs font-medium text-text-secondary mb-3 px-4">
                  Monte seu cardápio da semana para gerar a lista de compras automaticamente.
                </p>
                <Link 
                  to="/app/semana/nova" 
                  className="inline-block bg-primary text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-primary/95 transition-all no-underline shadow-sm"
                >
                  Criar Planejamento
                </Link>
              </div>
            ) : !shoppingList ? (
              <div className="py-6 text-center bg-white/30 rounded-2xl border border-white/40 relative z-10 flex flex-col justify-center items-center">
                <p className="text-xs font-medium text-text-secondary mb-3 px-4">
                  Sua lista de compras ainda não foi gerada para esta semana.
                </p>
                <button 
                  onClick={handleGenerateList}
                  disabled={generateList.isPending}
                  className="bg-primary text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-primary/95 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {generateList.isPending ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    'Gerar Lista'
                  )}
                </button>
              </div>
            ) : !shoppingList.items || shoppingList.items.length === 0 ? (
              <div className="py-6 text-center bg-white/30 rounded-2xl border border-white/40 relative z-10">
                <p className="text-xs font-medium text-text-secondary px-4">
                  Nenhum item na sua lista de compras. Adicione receitas com ingredientes ao planejamento.
                </p>
              </div>
            ) : (
              <ul className="space-y-3 relative z-10">
                {shoppingList.items.slice(0, 3).map((item) => (
                  <li key={item.id} className="bg-white/50 p-2.5 rounded-xl border border-white/50">
                    <button
                      onClick={() => toggleShoppingItem.mutate({ itemId: item.id, isChecked: !item.is_checked })}
                      disabled={toggleShoppingItem.isPending}
                      className="focus:outline-none flex items-center gap-3 w-full text-left cursor-pointer disabled:opacity-60"
                    >
                      <div className={`w-5 h-5 rounded-full border-2 transition-colors flex items-center justify-center shrink-0 ${
                         item.is_checked 
                          ? 'bg-primary border-primary' 
                          : 'border-primary hover:bg-primary/10'
                      }`}>
                        {item.is_checked && <Plus className="h-3 w-3 text-white rotate-45" />}
                      </div>
                      <span className={`text-sm font-medium transition-all truncate ${
                        item.is_checked ? 'text-warm-gray-medium line-through opacity-60' : 'text-on-surface'
                      }`}>
                        {item.ingredient_label}
                        {item.quantity_label && ` (${item.quantity_label})`}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          {activeWeek && shoppingList && (
            <Link 
              to={`/app/semana/${activeWeek.id}/compras`}
              className="w-full mt-6 text-primary font-bold text-sm py-2 block text-center no-underline border-b-2 border-transparent hover:border-primary transition-all relative z-10"
            >
              Ver lista completa
            </Link>
          )}
        </div>

        {/* Planning Assistant Card */}
        <div 
          className="col-span-12 lg:col-span-4 bg-white border rounded-3xl p-6 shadow-sm flex flex-col justify-between"
          style={{ borderColor: 'var(--color-outline-variant)' }}
        >
          <div className="space-y-5">
            <h3 className="text-lg font-bold flex items-center gap-2 text-on-surface">
              <ListChecks className="h-5 w-5 text-primary" />
              Assistente de Planejamento
            </h3>

            {/* 1. Planning Progress */}
            {activeWeek ? (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                  <span>Progresso do Cardápio</span>
                  <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-bold">
                    {plannedDaysCount} de {targetPlanDays} {targetPlanDays === 1 ? 'dia' : 'dias'}
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-primary h-full rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, (plannedDaysCount / targetPlanDays) * 100)}%` }} 
                  />
                </div>
                <p className="text-[11px] text-text-secondary font-medium">
                  {plannedDaysCount === 0 ? (
                    "Monte seu cardápio semanal para organizar suas refeições."
                  ) : plannedDaysCount >= targetPlanDays ? (
                    "🎉 Meta semanal atingida com sucesso!"
                  ) : (
                    `Falta planejar mais ${targetPlanDays - plannedDaysCount} ${targetPlanDays - plannedDaysCount === 1 ? 'dia' : 'dias'} para atingir sua meta.`
                  )}
                </p>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 border rounded-2xl text-center space-y-2">
                <CalendarDays className="h-8 w-8 text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-slate-700">Sem semana ativa</p>
                <p className="text-[11px] text-slate-500">Crie uma nova semana no planejador para começar.</p>
                <Link 
                  to="/app/semana" 
                  className="inline-block text-xs font-bold bg-primary text-white px-4 py-2 rounded-xl no-underline"
                >
                  Criar Semana
                </Link>
              </div>
            )}

            {/* 2. Dietary Auditor */}
            {activeWeek && preferences && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-500 block">Auditoria de Dieta</span>
                {preferences.dietary_restrictions && preferences.dietary_restrictions.length > 0 ? (
                  dietaryWarnings.length > 0 ? (
                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3.5 space-y-2 max-h-[140px] overflow-y-auto">
                      <div className="flex items-center gap-1.5 text-amber-800">
                        <span className="text-xs font-bold">⚠️ Conflito de Restrições</span>
                      </div>
                      <ul className="space-y-1.5">
                        {dietaryWarnings.map((warning, idx) => (
                          <li key={idx} className="text-[11px] text-amber-900 leading-relaxed font-semibold">
                            A receita{' '}
                            <Link 
                              to={`/app/receitas/${warning.recipeSlug}`} 
                              className="underline hover:text-amber-950 font-bold"
                            >
                              {warning.recipeTitle}
                            </Link>{' '}
                            pode conter ingredientes não recomendados para{' '}
                            <span className="bg-amber-100 px-1 py-0.5 rounded text-[10px] text-amber-800">
                              {getRestrictionLabel(warning.restriction)}
                            </span>.
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="bg-green-50 border border-green-100 rounded-2xl p-3 flex items-center gap-2">
                      <span className="text-lg">🥗</span>
                      <p className="text-xs text-green-800 font-bold leading-relaxed">
                        Cardápio 100% alinhado com suas restrições alimentares!
                      </p>
                    </div>
                  )
                ) : (
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 text-center">
                    <p className="text-xs text-slate-500 font-medium">
                      Nenhuma restrição alimentar ativa.{' '}
                      <Link to="/app/perfil?tab=preferencias" className="text-primary font-bold hover:underline">
                        Adicionar restrições
                      </Link>
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 3. Portions & Meals Statistics */}
            {activeWeek && preferences && totalMealsCount > 0 && (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50/60 border border-slate-100 rounded-2xl p-3 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Refeições</span>
                  <span className="text-lg font-extrabold text-slate-800">{totalMealsCount}</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5 font-medium">no cardápio</span>
                </div>
                <div className="bg-slate-50/60 border border-slate-100 rounded-2xl p-3 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Porções Totais</span>
                  <span className="text-lg font-extrabold text-slate-800">{estimatedPortions}</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5 font-medium">para {preferences.household_size} {preferences.household_size === 1 ? 'pessoa' : 'pess.'}</span>
                </div>
              </div>
            )}

            {/* 4. Goal-based Tip */}
            {preferences?.primary_goal && (
              <div className="p-3.5 rounded-2xl bg-orange-50/40 border border-orange-100/60">
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary block mb-1 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Dica de Objetivo
                </span>
                {preferences.primary_goal === 'save_time' && (
                  <p className="text-xs text-slate-700 leading-relaxed font-semibold">
                    ⏱️ Poupar Tempo: Priorize receitas de uma panela (one-pot) ou pratos rápidos para otimizar seu dia.
                  </p>
                )}
                {preferences.primary_goal === 'save_money' && (
                  <p className="text-xs text-slate-700 leading-relaxed font-semibold">
                    💰 Economizar: Compre a granel e planeje pratos compartilhando ingredientes frescos para reduzir o desperdício.
                  </p>
                )}
                {preferences.primary_goal === 'eat_better' && (
                  <p className="text-xs text-slate-700 leading-relaxed font-semibold">
                    🥗 Comer Melhor: Adicione mais cores ao seu prato! Vegetais ricos em fibras aumentam a saciedade.
                  </p>
                )}
                {preferences.primary_goal === 'family_meals' && (
                  <p className="text-xs text-slate-700 leading-relaxed font-semibold">
                    👨‍👩‍👧‍👦 Refeições Familiares: Cozinhe porções extras e congele para alimentar a família nos dias corridos.
                  </p>
                )}
                {preferences.primary_goal === 'variety' && (
                  <p className="text-xs text-slate-700 leading-relaxed font-semibold">
                    🔄 Variar Menu: Experimente incluir uma categoria de receita totalmente nova nas suas compras da semana.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 mt-6">
            {activeWeek && (
              <Link 
                to={`/app/semana/${activeWeek.id}`}
                className="w-full bg-primary hover:bg-primary-hover text-white font-bold text-sm py-3 px-4 rounded-xl text-center no-underline transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                <CalendarDays className="h-4 w-4" />
                Ver Cardápio Semanal
              </Link>
            )}
            <Link 
              to="/app/perfil?tab=preferencias"
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm py-2.5 px-4 rounded-xl text-center no-underline transition-all flex items-center justify-center gap-1.5"
            >
              Ajustar Preferências
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Editorial Notices */}
      {latestNotice && (
        <div 
          className="mb-10 p-5 rounded-3xl border flex gap-4 items-start shadow-sm"
          style={{ 
            backgroundColor: 'color-mix(in srgb, var(--color-primary-container) 10%, transparent)',
            borderColor: 'var(--color-primary-container)'
          }}
        >
          <div className="rounded-2xl p-3 shadow-sm" style={{ backgroundColor: 'white' }}>
            <Sparkles className="h-5 w-5 text-primary" style={{ color: 'var(--color-primary)' }} />
          </div>
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest mb-1 text-primary">
              {latestNotice.notice_type === 'tip' ? 'Dica do Editor' : 'Aviso do Sistema'}
            </h4>
            <p className="text-sm font-bold text-on-surface">
              {latestNotice.body}
            </p>
          </div>
        </div>
      )}

      {/* Inspirations Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">{sectionTitle}</h3>
          <Link to="/app/favoritos" className="text-primary font-bold text-sm flex items-center gap-1 no-underline">
            Ver todos <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        
        {favsLoading || recsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border shadow-sm h-64 animate-pulse" style={{ borderColor: 'var(--color-outline-variant)' }} />
            ))}
          </div>
        ) : displayRecipes.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl border" style={{ borderColor: 'var(--color-outline-variant)' }}>
            <Utensils className="h-10 w-10 text-text-secondary opacity-30 mx-auto mb-3" />
            <p className="text-sm font-medium text-text-secondary">Nenhuma receita recomendada disponível.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayRecipes.map((recipe) => {
              const isLocked = recipe.is_premium && !isPremiumUser;
              return (
                <Link 
                  key={recipe.id} 
                  to={`/app/receitas/${recipe.slug}`}
                  className="bg-white rounded-2xl overflow-hidden border shadow-sm hover:shadow-md transition-shadow group cursor-pointer no-underline block" 
                  style={{ borderColor: 'var(--color-outline-variant)' }}
                >
                  <div className="h-44 relative overflow-hidden bg-slate-100">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleFavorite.mutate({ recipeId: recipe.id, isFavorite: isRecipeFavorite(recipe.id) });
                      }}
                      disabled={toggleFavorite.isPending}
                      className="absolute top-4 right-4 bg-white/90 hover:bg-white p-2 rounded-full backdrop-blur-md shadow-sm z-10 active:scale-90 transition-transform cursor-pointer disabled:opacity-50"
                    >
                      <Star 
                        className={`h-4 w-4 transition-colors ${
                          isRecipeFavorite(recipe.id) 
                            ? 'text-tertiary fill-tertiary' 
                            : 'text-warm-gray-medium hover:text-tertiary'
                        }`} 
                      />
                    </button>
                    {recipe.cover_image_url ? (
                      <img 
                        src={recipe.cover_image_url} 
                        alt={recipe.title} 
                        className={cn("h-full w-full object-cover group-hover:scale-105 transition-transform duration-300", isLocked && "brightness-50")}
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-slate-400">
                         <Utensils className="h-12 w-12 opacity-20" />
                      </div>
                    )}

                    {/* Premium Lock Overlay */}
                    {isLocked && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/40 backdrop-blur-[1px]">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-400/90 shadow-md">
                          <Lock className="h-4 w-4 text-amber-950" />
                        </div>
                        <span className="text-[9px] font-black text-white uppercase tracking-wider">Exclusivo Pro</span>
                      </div>
                    )}

                    {/* Premium badge */}
                    {recipe.is_premium && (
                      <span className="absolute top-4 left-4 flex items-center gap-1 rounded-full bg-amber-400/95 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-950 shadow z-10">
                        <Crown className="h-2.5 w-2.5" />
                        Pro
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex gap-2 mb-2">
                      <span className="bg-green-50 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                        {recipe.usage_context || 'Receita'}
                      </span>
                      <span className="bg-neutral-100 text-neutral-600 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                        {recipe.prep_time_minutes} min
                      </span>
                    </div>
                    <h4 className="font-bold text-lg text-on-surface mb-2 group-hover:text-primary transition-colors line-clamp-1">
                      {recipe.title}
                    </h4>
                    <div className="flex items-center gap-4 text-text-secondary text-[11px] font-medium">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{getDifficultyLabel(recipe.difficulty_level)}</span>
                      <span className="flex items-center gap-1"><PiggyBank className="h-3 w-3" />{getCostLabel(recipe.cost_level)}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  )
}
