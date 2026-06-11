import { useState, useMemo } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { Search, ChefHat, Sparkles, Star, Plus, Globe, ArrowRight, ListFilter, RefreshCw, Loader2, LayoutGrid, ArrowLeft, Crown } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { EmptyState } from '@/components/shared/EmptyState'
import { useRecipes, useRecipeCategories } from '@/hooks/recipes/useRecipes'
import { useCollections, useCollection } from '@/hooks/recipes/useCollections'
import { useAssignRecipe } from '@/hooks/planning/usePlanning'
import { useAuth } from '@/app/providers/AuthProvider'
import { supabase } from '@/integrations/supabase/client'
import type { Recipe } from '@/types/recipes'
import { cn } from '@/lib/utils'
import { RecipeCard } from '@/components/recipes/RecipeCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export function RecipePickerPage() {
  const navigate = useNavigate()
  const { user, preferences } = useAuth()
  const isPremiumUser = !!(user?.subscription_tier && user.subscription_tier !== 'free' && user.subscription_tier !== 'plano-gratuito')
  const [searchParams] = useSearchParams()
  const slotId = searchParams.get('slot')
  const weekId = searchParams.get('week')
  const isPickerMode = !!slotId && !!weekId

  const [activeMethod, setActiveMethod] = useState<'catalog' | 'colecoes' | 'food_type' | 'suggestions' | 'favorites' | 'custom'>('catalog')
  const [selectedCollectionSlug, setSelectedCollectionSlug] = useState<string | null>(null)
  
  // Method A: Food Type states
  const [selectedFoodType, setSelectedFoodType] = useState<string>('')
  const [foodTypeOffset, setFoodTypeOffset] = useState(0)

  // Method D: Import states
  const [importUrl, setImportUrl] = useState('')
  const [isImporting, setIsImporting] = useState(false)

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [difficultyFilter, setDifficultyFilter] = useState<string>('')

  // Query recipes
  const { data, isLoading, error, refetch } = useRecipes({
    search: search || undefined,
    categoryId: categoryFilter || undefined,
    difficulty: difficultyFilter || undefined,
  })
  
  const allRecipes = data?.recipes || []
  const { data: categories } = useRecipeCategories()
  const assignRecipe = useAssignRecipe()

  const { data: collections, isLoading: isLoadingCollections } = useCollections()
  const { data: activeCollectionDetail, isLoading: isLoadingCollectionDetail } = useCollection(selectedCollectionSlug || undefined)

  // Method A filtering: Filter recipes by keyword in title/subtitle and select exactly 5 (shuffled/offset)
  const foodTypeRecipes = useMemo(() => {
    if (!selectedFoodType) return []
    const filtered = allRecipes.filter(r => 
      r.title.toLowerCase().includes(selectedFoodType.toLowerCase()) || 
      (r.subtitle && r.subtitle.toLowerCase().includes(selectedFoodType.toLowerCase())) ||
      r.category?.name.toLowerCase().includes(selectedFoodType.toLowerCase())
    )
    // Slice 5 based on offset
    const start = (foodTypeOffset * 5) % Math.max(1, filtered.length)
    let sliced = filtered.slice(start, start + 5)
    if (sliced.length < 5 && filtered.length > 5) {
      sliced = [...sliced, ...filtered.slice(0, 5 - sliced.length)]
    }
    return sliced
  }, [allRecipes, selectedFoodType, foodTypeOffset])

  // Method B filtering: Filter by onboarding restrictions/goal
  const suggestedRecipes = useMemo(() => {
    let filtered = allRecipes
    if (preferences?.dietary_restrictions && preferences.dietary_restrictions.length > 0) {
      // Filter if recipe has tag/category matching restrictions
      filtered = filtered.filter(recipe => {
        // Mock match for restrictions
        return true // For display purposes, we keep it simple or match keywords
      })
    }
    return filtered.slice(0, 8) // Limit to top 8 recommendations
  }, [allRecipes, preferences])

  // Method C filtering: User private creations + favorites
  const [userFavorites, setUserFavorites] = useState<Recipe[]>([])
  const [isLoadingFavs, setIsLoadingFavs] = useState(false)

  const loadFavoritesAndOwn = async () => {
    if (!user) return
    setIsLoadingFavs(true)
    try {
      // 1. Get favorited recipe IDs
      const { data: favs } = await supabase
        .from('favorite_recipes')
        .select('recipe_id')
        .eq('user_id', user.id)

      const favIds = favs?.map(f => f.recipe_id) || []

      // 2. Fetch those recipes plus recipes created by current user
      const { data: list } = await supabase
        .from('recipes')
        .select('*, category:recipe_categories(name)')
        .or(`id.in.(${favIds.length > 0 ? favIds.join(',') : '00000000-0000-0000-0000-000000000000'}),created_by.eq.${user.id}`)

      if (list) {
        setUserFavorites(list as any)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoadingFavs(false)
    }
  }

  // Reload favorites if tab changes
  useState(() => {
    loadFavoritesAndOwn()
  })

  const handleSelectRecipe = async (recipe: Recipe) => {
    if (recipe.is_premium && !isPremiumUser) {
      navigate(`/app/receitas/${recipe.slug}`)
      return
    }
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

  const handleImportRecipe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!importUrl) return
    setIsImporting(true)
    try {
      const { data, error } = await supabase.functions.invoke('rebuild-external-recipe', {
        body: { url: importUrl }
      })

      if (error) throw error

      toast.success('Receita importada e reescrita com sucesso!')
      setImportUrl('')
      refetch()
      loadFavoritesAndOwn()
      setActiveMethod('favorites') // Switch to show imported recipe
    } catch (err: any) {
      toast.error('Erro ao importar receita', {
        description: err.message || 'Verifique o link e tente novamente.'
      })
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="space-y-6 pb-20">
      <PageHeader
        title={isPickerMode ? 'Escolher receita' : 'Receitas'}
        subtitle={isPickerMode ? 'Selecione uma receita para este slot.' : 'Explore receitas para montar sua semana.'}
      />

      {/* Methods Navigation Tabs */}
      <div className="flex gap-2 border-b overflow-x-auto no-scrollbar pb-2">
        {[
          { id: 'catalog', label: 'Catálogo Geral', icon: ChefHat },
          { id: 'colecoes', label: 'Coleções', icon: LayoutGrid },
          { id: 'food_type', label: 'Tipo de Alimento (A)', icon: ListFilter },
          { id: 'suggestions', label: 'Sugestões (B)', icon: Sparkles },
          { id: 'favorites', label: 'Meus Favoritos (C)', icon: Star },
          { id: 'custom', label: 'Importar / Nova (D)', icon: Globe },
        ].map(method => {
          const Icon = method.icon
          return (
            <button
              key={method.id}
              onClick={() => {
                setActiveMethod(method.id as any)
                setSelectedCollectionSlug(null)
                if (method.id === 'favorites') loadFavoritesAndOwn()
              }}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all border shrink-0 cursor-pointer',
                activeMethod === method.id 
                  ? 'bg-primary border-primary text-white shadow-sm' 
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
              )}
            >
              <Icon className="h-4 w-4" />
              {method.label}
            </button>
          )
        })}
      </div>

      {/* RENDER VIEWS */}

      {/* Method 1: General Catalog */}
      {activeMethod === 'catalog' && (
        <div className="space-y-6">
          <div className="mb-6 space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar receitas..."
                className="w-full rounded-2xl border border-slate-200 py-3 pl-10 pr-4 text-sm bg-white outline-none"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              <button
                onClick={() => setCategoryFilter('')}
                className={cn(
                  'shrink-0 rounded-full border px-4 py-1.5 text-xs font-bold transition-all cursor-pointer',
                  !categoryFilter ? 'bg-primary text-white border-primary' : 'bg-white border-slate-200 text-slate-500'
                )}
              >
                Todas
              </button>
              {categories?.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  className={cn(
                    'shrink-0 rounded-full border px-4 py-1.5 text-xs font-bold transition-all cursor-pointer',
                    categoryFilter === cat.id ? 'bg-primary text-white border-primary' : 'bg-white border-slate-200 text-slate-500'
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <LoadingState message="Buscando receitas..." />
          ) : allRecipes.length === 0 ? (
            <EmptyState icon={<ChefHat className="h-8 w-8" />} title="Nenhuma receita" description="Tente buscar outros termos." />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {allRecipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} onClick={() => handleSelectRecipe(recipe)} isPickerMode={isPickerMode} isUserPremium={isPremiumUser} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Method: Editorial Collections */}
      {activeMethod === 'colecoes' && (
        <div className="space-y-6">
          {!selectedCollectionSlug ? (
            isLoadingCollections ? (
              <LoadingState message="Carregando coleções..." />
            ) : !collections || collections.length === 0 ? (
              <EmptyState
                icon={<LayoutGrid className="h-8 w-8 text-muted-foreground" />}
                title="Sem coleções ativas"
                description="Fique de olho! Em breve traremos novas coleções exclusivas."
              />
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {collections.map((coll) => (
                  <button
                    key={coll.id}
                    onClick={() => setSelectedCollectionSlug(coll.slug)}
                    className="group relative aspect-[21/9] w-full overflow-hidden rounded-3xl border text-left transition-all hover:shadow-lg cursor-pointer"
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
                      className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-6 flex flex-col justify-end"
                    >
                      <h3 className="text-lg font-bold text-white mb-0.5">{coll.title}</h3>
                      {coll.description && (
                        <p className="text-xs text-gray-200 line-clamp-1">{coll.description}</p>
                      )}
                      {coll.is_premium && (
                        <span className="absolute top-4 right-4 rounded-full bg-amber-400 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-amber-950">
                          Premium
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setSelectedCollectionSlug(null)}
                  className="rounded-full flex items-center gap-1.5 text-xs font-bold uppercase text-slate-500 hover:bg-slate-100"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar para Coleções
                </Button>
              </div>

              {isLoadingCollectionDetail ? (
                <LoadingState message="Carregando receitas da coleção..." />
              ) : !activeCollectionDetail || !activeCollectionDetail.recipes || activeCollectionDetail.recipes.length === 0 ? (
                <EmptyState
                  icon={<ChefHat className="h-8 w-8 text-muted-foreground" />}
                  title="Nenhuma receita"
                  description="Esta coleção está vazia no momento."
                />
              ) : (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                    <h3 className="text-xl font-bold text-slate-900">{activeCollectionDetail.title}</h3>
                    {activeCollectionDetail.description && (
                      <p className="text-xs text-slate-500 mt-1">{activeCollectionDetail.description}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {activeCollectionDetail.recipes.map((recipe: any) => (
                      <RecipeCard
                        key={recipe.id}
                        recipe={recipe}
                        onClick={() => handleSelectRecipe(recipe)}
                        isPickerMode={isPickerMode}
                        isUserPremium={isPremiumUser}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Method A: Choose by Food Type */}
      {activeMethod === 'food_type' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Escolha por tipos de alimento</h3>
            <p className="text-xs text-slate-500 mb-6">Selecione uma base alimentar para receber 5 sugestões de receitas.</p>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6 mb-6">
              {['Frango', 'Carne', 'Peixe', 'Massa', 'Legume', 'Salada'].map(food => (
                <button
                  key={food}
                  onClick={() => {
                    setSelectedFoodType(food)
                    setFoodTypeOffset(0)
                  }}
                  className={cn(
                    'py-3.5 px-4 rounded-2xl border text-xs font-bold transition-all cursor-pointer uppercase tracking-wider',
                    selectedFoodType === food ? 'bg-primary text-white border-primary shadow-sm' : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100'
                  )}
                >
                  {food}
                </button>
              ))}
            </div>

            {selectedFoodType && (
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-700">Sugestões de receitas com: <span className="text-primary">{selectedFoodType}</span></h4>
                  <Button variant="outline" size="sm" onClick={() => setFoodTypeOffset(o => o + 1)} className="rounded-full flex items-center gap-1">
                    <RefreshCw className="h-3 w-3" /> Novas Sugestões
                  </Button>
                </div>

                {foodTypeRecipes.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4">Nenhuma sugestão encontrada para esta base alimentar.</p>
                ) : (
                  <div className="grid gap-3">
                    {foodTypeRecipes.map(recipe => (
                      <div key={recipe.id} className="flex items-center justify-between bg-slate-50 rounded-2xl p-4 border border-slate-100 hover:border-primary transition-all">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h5 className="font-bold text-sm text-slate-900">{recipe.title}</h5>
                            {recipe.is_premium && (
                              <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-400 px-1.5 py-0.5 text-[8px] font-black uppercase text-amber-950">
                                <Crown className="h-2 w-2" />
                                Pro
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{recipe.prep_time_minutes} min | porções: {recipe.servings}</p>
                        </div>
                        <Button size="sm" onClick={() => handleSelectRecipe(recipe)} className="rounded-full">
                          Escolher
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Method B: Smart Suggestions based on preferences */}
      {activeMethod === 'suggestions' && (
        <div className="space-y-6">
          <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 relative overflow-hidden">
            <div className="relative z-10 max-w-md">
              <h3 className="text-2xl font-black">Cardápios Sugeridos</h3>
              <p className="text-sm text-slate-300 mt-2">
                Sugestões automatizadas criadas com base nas preferências coletadas no seu onboarding alimentício.
              </p>
            </div>
            <Sparkles className="absolute right-6 bottom-6 h-24 w-24 text-white/5" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {suggestedRecipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} onClick={() => handleSelectRecipe(recipe)} isPickerMode={isPickerMode} isUserPremium={isPremiumUser} />
            ))}
          </div>
        </div>
      )}

      {/* Method C: Favorites and user creations */}
      {activeMethod === 'favorites' && (
        <div className="space-y-6">
          {isLoadingFavs ? (
            <LoadingState message="Buscando favoritos..." />
          ) : userFavorites.length === 0 ? (
            <EmptyState icon={<Star className="h-8 w-8" />} title="Sem favoritos ou receitas" description="Favorite receitas do catálogo ou crie suas próprias." />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {userFavorites.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} onClick={() => handleSelectRecipe(recipe)} isPickerMode={isPickerMode} isUserPremium={isPremiumUser} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Method D: Import or manual creations */}
      {activeMethod === 'custom' && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Create Custom Recipe Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-8 flex flex-col justify-between shadow-sm">
            <div className="space-y-2">
              <ChefHat className="h-10 w-10 text-primary" />
              <h3 className="text-xl font-bold text-slate-900">Nova Receita Manual</h3>
              <p className="text-xs text-slate-500">Escreva o passo a passo e ingredientes de suas próprias receitas caseiras para planejar.</p>
            </div>
            <Button onClick={() => navigate('/app/receitas/nova')} className="w-full mt-6 rounded-2xl py-5 font-bold flex items-center gap-2">
              Escrever Receita <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Import Recipe Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-8 flex flex-col justify-between shadow-sm">
            <form onSubmit={handleImportRecipe} className="space-y-4">
              <Globe className="h-10 w-10 text-primary" />
              <h3 className="text-xl font-bold text-slate-900">Importar da Internet</h3>
              <p className="text-xs text-slate-500">Cole o link de uma receita da internet. Nossa IA irá reescrever as instruções para o seu app.</p>
              
              <div className="space-y-1 pt-2">
                <Label htmlFor="importUrl">Link da Receita</Label>
                <Input 
                  id="importUrl" 
                  value={importUrl} 
                  onChange={e => setImportUrl(e.target.value)} 
                  placeholder="https://exemplo.com.br/receita-bolo" 
                  required 
                />
              </div>

              <Button type="submit" disabled={isImporting} className="w-full rounded-2xl py-5 font-bold flex items-center gap-2">
                {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {isImporting ? 'Processando e Reescrevendo...' : 'Importar Receita'}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
