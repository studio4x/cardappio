import { Link } from 'react-router-dom'
import { CalendarDays, Plus, ShoppingCart, ChefHat, Sparkles, BookOpen, Heart, ArrowRight, Star, Utensils, Clock, PiggyBank, CheckSquare as ListChecks, Loader2 } from 'lucide-react'
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
  const { user } = useAuth()
  const { data: activeWeek, isLoading: weekLoading } = useActiveWeek()
  const { data: notices } = useEditorialNotices()
  
  // Shopping list hooks
  const { data: shoppingList, isLoading: listLoading } = useShoppingList(activeWeek?.id)
  const toggleShoppingItem = useToggleShoppingItem()
  const generateList = useGenerateShoppingList()

  // Favorites & Recommended hooks
  const { data: favorites, isLoading: favsLoading } = useFavorites()
  const { data: recommendedRecipesData, isLoading: recsLoading } = useRecipes({ pageSize: 3 })
  const toggleFavorite = useToggleFavorite()

  const greetingName = user?.full_name ? user.full_name.split(' ')[0] : 'usuário'
  const greeting = `Olá, ${greetingName}! 👋`

  const latestNotice = notices?.[0]

  // Detect current day
  const daysOfWeekMap: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const todayName = daysOfWeekMap[new Date().getDay()]

  const hasFavorites = favorites && favorites.length > 0
  const displayRecipes: Recipe[] = hasFavorites 
    ? (favorites.slice(0, 3) as Recipe[]) 
    : (recommendedRecipesData?.recipes?.slice(0, 3) ?? [])
  const sectionTitle = hasFavorites ? "Inspirado nos seus Favoritos" : "Receitas Recomendadas"

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
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1 block">Dashboard</span>
            <h2 className="text-3xl font-bold text-on-surface">{greeting}</h2>
            <p className="text-text-secondary mt-1">Organize seu cardápio da semana de forma rápida e prática.</p>
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
          className="md:col-span-8 bg-white border rounded-3xl p-6 shadow-sm overflow-hidden"
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
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[...(activeWeek?.days ?? [])]
                .sort((a, b) => a.sort_order - b.sort_order)
                .slice(0, 4)
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
                        {filledCount > 0 ? `${filledCount} Planejados` : "Vazio"}
                      </p>
                    </div>
                  )
                })}
            </div>
          )}
        </div>

        {/* Quick Shopping List Card */}
        <div 
          className="md:col-span-4 bg-white border rounded-3xl p-6 shadow-sm relative overflow-hidden flex flex-col justify-between"
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
            {displayRecipes.map((recipe) => (
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
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-slate-400">
                       <Utensils className="h-12 w-12 opacity-20" />
                    </div>
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
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
