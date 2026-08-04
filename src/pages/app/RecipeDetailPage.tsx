import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, Users, Sparkles, Lock, Utensils, ShoppingBasket, Plus, BarChart3, PillIcon, Calendar, CheckCircle2, ChevronRight, Loader2, PiggyBank, Crown, FileText } from 'lucide-react'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { useRecipe } from '@/hooks/recipes/useRecipes'
import { FavoriteButton } from '@/components/recipes/FavoriteButton'
import { RecipeIngredients } from '@/components/recipes/RecipeIngredients'
import { RecipeSteps } from '@/components/recipes/RecipeSteps'
import { AudioPlayerRecipe } from '@/components/recipes/AudioPlayerRecipe'
import { RecipeShare } from '@/components/recipes/RecipeShare'
import { useAuth } from '@/app/providers/AuthProvider'
import { isUserPro } from '@/lib/subscription'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useWeeks, useAssignRecipe } from '@/hooks/planning/usePlanning'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription
} from '@/components/ui/dialog'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export function RecipeDetailPage() {
  const { recipeSlug } = useParams()
  const navigate = useNavigate()
  const { data: recipe, isLoading, error, refetch } = useRecipe(recipeSlug)
  const { user, preferences } = useAuth() 
  const [activeTab, setActiveTab] = useState<'ingredients' | 'instructions'>('ingredients')
  
  // States for adding to plan modal wizard
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [modalStep, setModalStep] = useState<'weeks' | 'days' | 'slots'>('weeks')
  const [selectedWeekId, setSelectedWeekId] = useState<string | null>(null)
  const [selectedWeekTitle, setSelectedWeekTitle] = useState<string>('')
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null)
  const [selectedDayName, setSelectedDayName] = useState<string>('')

  // Queries for planning
  const { data: weeks, isLoading: isLoadingWeeks } = useWeeks()
  const assignRecipe = useAssignRecipe()

  const { data: days, isLoading: isLoadingDays } = useQuery({
    queryKey: ['week-days', selectedWeekId],
    queryFn: async () => {
      if (!selectedWeekId) return []
      const { data, error } = await supabase
        .from('meal_plan_days')
        .select('id, day_of_week')
        .eq('week_id', selectedWeekId)
        .order('sort_order')
      if (error) throw error
      return data
    },
    enabled: !!selectedWeekId
  })

  const { data: slots, isLoading: isLoadingSlots } = useQuery({
    queryKey: ['day-slots', selectedDayId],
    queryFn: async () => {
      if (!selectedDayId) return []
      const { data, error } = await supabase
        .from('meal_plan_slots')
        .select('id, meal_type, recipe_id')
        .eq('day_id', selectedDayId)
        .order('sort_order')
      if (error) throw error
      return data
    },
    enabled: !!selectedDayId
  })

  const handleAssignToSlot = async (slotId: string) => {
    if (!recipe) return
    try {
      await assignRecipe.mutateAsync({
        slotId,
        recipeId: recipe.id
      })
      toast.success('Receita adicionada ao seu plano semanal!')
      setIsAddModalOpen(false)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao adicionar receita ao plano.')
    }
  }

  const isPremiumUser = isUserPro(user)
  const isLocked = recipe?.is_premium && !isPremiumUser

  const difficultyLabels = { easy: 'Fácil', medium: 'Médio', hard: 'Difícil' }
  const costLabels = { low: 'Econômico', medium: 'Moderado', high: 'Premium' }
  const dayNames: Record<string, string> = {
    monday: 'Segunda-feira',
    tuesday: 'Terça-feira',
    wednesday: 'Quarta-feira',
    thursday: 'Quinta-feira',
    friday: 'Sexta-feira',
    saturday: 'Sábado',
    sunday: 'Domingo'
  }
  const mealNames: Record<string, string> = {
    breakfast: 'Café da Manhã',
    lunch: 'Almoço',
    dinner: 'Jantar',
    snack: 'Lanche'
  }

  if (isLoading) return <LoadingState message="Carregando receita..." />
  if (error || !recipe) return <ErrorState onRetry={() => refetch()} />

  if (isLocked) {
    return (
      <div className="pb-20 pt-2 md:pt-4 flex flex-col items-center w-full">
        {/* Back navigation */}
        <div className="flex items-center justify-between mb-6 w-full max-w-2xl">
          <button 
            onClick={() => navigate(-1)}
            className="active:scale-95 transition-transform hover:bg-neutral-100 py-2 px-3 rounded-full cursor-pointer flex items-center gap-1.5 text-xs font-bold uppercase text-slate-500"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>
        </div>

        {/* Locked Page Card */}
        <div className="w-full max-w-2xl bg-slate-900 rounded-[2.5rem] text-white p-8 md:p-12 shadow-2xl relative overflow-hidden border border-amber-500/20">
          {/* Background decoration or image blur */}
          {recipe.cover_image_url && (
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-15 blur-lg pointer-events-none" 
              style={{ backgroundImage: `url(${recipe.cover_image_url})` }}
            />
          )}
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Crown className="h-32 w-32 text-amber-400 rotate-12" />
          </div>

          <div className="relative z-10 flex flex-col items-center text-center space-y-6">
            <div className="h-16 w-16 bg-amber-400/10 rounded-2xl flex items-center justify-center border border-amber-400/30 text-amber-400 animate-pulse">
              <Lock className="h-8 w-8" />
            </div>

            <div className="space-y-2 max-w-md">
              <h2 className="text-2xl md:text-3xl font-black text-white leading-tight">
                Receita Pro Exclusiva
              </h2>
              <p className="text-sm text-slate-300 font-bold uppercase tracking-wider text-amber-400">
                {recipe.title}
              </p>
              <p className="text-sm text-slate-400 pt-2 leading-relaxed">
                Esta receita faz parte do catálogo premium. Faça upgrade para o plano Pro e tenha acesso ilimitado a esta e centenas de outras preparações deliciosas.
              </p>
            </div>

            {/* Benefits List */}
            <div className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 text-left space-y-4 my-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 border-b border-white/10 pb-2">
                Benefícios do Plano Pro
              </h3>
              <ul className="space-y-3.5">
                {[
                  { title: 'Acesso a +500 receitas premium', desc: 'Pratos elaborados e receitas exclusivas Pro' },
                  { title: 'Planejamento de 7 dias da semana', desc: 'Organize de segunda a domingo sem limites' },
                  { title: 'Lista de compras inteligente e ilimitada', desc: 'Gerada automaticamente a partir do cardápio' },
                  { title: 'IA Cozinheira / Narração por voz', desc: 'Passo a passo por áudio para cozinhar sem tocar na tela' },
                  { title: 'Filtros avançados e preferências', desc: 'Restrições e preferências adaptadas perfeitamente' }
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-500/30">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-100 leading-tight">{item.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5 leading-snug">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 w-full pt-4">
              <Button 
                onClick={() => navigate('/app/assinatura')} 
                className="flex-1 rounded-2xl py-6 font-bold bg-amber-400 text-amber-950 hover:bg-amber-300 shadow-xl shadow-amber-400/10 active:scale-95 transition-all border-none"
              >
                Conhecer Planos Pro
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/app/receitas')} 
                className="flex-1 rounded-2xl py-6 font-bold border-white/10 text-white hover:bg-white/5 bg-transparent active:scale-95 transition-all"
              >
                Voltar para Receitas
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="pb-12 md:pb-16 pt-2 md:pt-4">
      {/* Back navigation & favorite button row */}
      <div className="flex items-center justify-between mb-6 w-full">
        <button 
          onClick={() => navigate(-1)}
          className="active:scale-95 transition-transform hover:bg-neutral-100 py-2 px-3 rounded-full cursor-pointer flex items-center gap-1.5 text-xs font-bold uppercase text-slate-500"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>
        <FavoriteButton recipeId={recipe.id} />
      </div>

      {/* Main Content */}
      <main className="w-full">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Left Column: Cover Image, Info Bento, Nutrition, Variations */}
          <div className="col-span-12 md:col-span-5 space-y-6">
            {/* Hero Section (Cover Image) */}
            <section className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden shadow-sm bg-neutral-100 flex items-center justify-center">
              {recipe.cover_image_url ? (
                <img src={recipe.cover_image_url} alt={recipe.title} className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center justify-center text-neutral-400 gap-2">
                  <Utensils className="h-16 w-16 opacity-30" />
                </div>
              )}
            </section>

            {/* Title & Category Info */}
            <div className="mt-5 px-1">
              <span className="inline-block bg-fresh-green/10 text-fresh-green text-[10px] uppercase font-extrabold px-3 py-1 rounded-full mb-2 tracking-wider">
                {recipe.category?.name || 'Receita'}
              </span>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight">
                {recipe.title}
              </h1>
              {recipe.subtitle && (
                <p className="mt-2 text-sm text-slate-500 leading-relaxed font-medium">
                  {recipe.subtitle}
                </p>
              )}
            </div>

             {/* Quick Info Bento */}
            <section className="mt-4">
              <div className="grid grid-cols-4 gap-0 bg-white rounded-2xl shadow-sm border overflow-hidden" style={{ borderColor: 'var(--color-outline-variant)' }}>
                <div className="flex flex-col items-center justify-center py-3 px-1 border-r" style={{ borderColor: 'var(--color-outline-variant)' }}>
                  <Clock className="h-5 w-5 text-fresh-green mb-1 shrink-0" />
                  <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wide text-center">Tempo</span>
                  <span className="text-[11px] font-bold text-on-surface text-center leading-tight mt-0.5">{recipe.prep_time_minutes} min</span>
                </div>
                <div className="flex flex-col items-center justify-center py-3 px-1 border-r" style={{ borderColor: 'var(--color-outline-variant)' }}>
                  <Users className="h-5 w-5 text-fresh-green mb-1 shrink-0" />
                  <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wide text-center">Porções</span>
                  <span className="text-[11px] font-bold text-on-surface text-center leading-tight mt-0.5">{recipe.servings} pps</span>
                </div>
                <div className="flex flex-col items-center justify-center py-3 px-1 border-r" style={{ borderColor: 'var(--color-outline-variant)' }}>
                  <BarChart3 className="h-5 w-5 text-fresh-green mb-1 shrink-0" />
                  <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wide text-center">Dific.</span>
                  <span className="text-[11px] font-bold text-on-surface text-center leading-tight mt-0.5">{difficultyLabels[recipe.difficulty_level as keyof typeof difficultyLabels] || recipe.difficulty_level}</span>
                </div>
                <div className="flex flex-col items-center justify-center py-3 px-1">
                  <PiggyBank className="h-5 w-5 text-fresh-green mb-1 shrink-0" />
                  <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wide text-center">Custo</span>
                  <span className="text-[11px] font-bold text-on-surface text-center leading-tight mt-0.5">{costLabels[recipe?.cost_level as keyof typeof costLabels] ?? 'Moderado'}</span>
                </div>
              </div>
            </section>

            {/* Botões de Compartilhamento */}
            <RecipeShare title={recipe.title} recipeSlug={recipeSlug || ''} />

            {/* Importer badge — only for non-admin users */}
            {(() => {
              const creator = (recipe as any).creator
              if (!creator) return null
              const role = creator.role as string
              if (role === 'admin' || role === 'super_admin') return null
              const name = creator.full_name || 'Usuário'
              return (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-sky-50 border border-sky-100 rounded-2xl text-sky-700">
                  <Sparkles className="h-3.5 w-3.5 shrink-0 text-sky-500" />
                  <span className="text-xs font-semibold">Importada pela comunidade · <span className="font-bold">{name}</span></span>
                </div>
              )
            })()}

            {/* Nutrition Info */}
            {recipe.nutrition_info && recipe.nutrition_info.nutrients ? (
              <div className="bg-white rounded-2xl p-5 border shadow-sm text-slate-900 border-slate-200" style={{ borderColor: 'var(--color-outline-variant)' }}>
                <h3 className="text-center font-black text-sm uppercase border-b-4 border-slate-950 pb-1 mb-2 tracking-wide">
                  Informação Nutricional
                </h3>
                <div className="text-xs space-y-0.5 mb-3 text-slate-800">
                  <p className="font-semibold">Porções por embalagem: <span className="font-bold">{recipe.servings}</span></p>
                  <p className="font-semibold">Porção: <span className="font-bold">{recipe.nutrition_info.serving_size_g_ml}g ou ml</span> ({recipe.nutrition_info.serving_size_household})</p>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead>
                      <tr className="border-b border-slate-950">
                        <th className="py-1 font-bold text-slate-400"></th>
                        <th className="py-1 font-bold text-slate-900 text-right pr-2">100 g/ml</th>
                        <th className="py-1 font-bold text-slate-900 text-right pr-2">Porção</th>
                        <th className="py-1 font-bold text-slate-900 text-right">%VD*</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {([
                        { label: 'Valor energético (kcal/kJ)', per100: `${recipe.nutrition_info.nutrients.energy_kcal?.per_100g ?? 0} / ${recipe.nutrition_info.nutrients.energy_kj?.per_100g ?? 0}`, perServing: `${recipe.nutrition_info.nutrients.energy_kcal?.per_serving ?? 0} / ${recipe.nutrition_info.nutrients.energy_kj?.per_serving ?? 0}`, vd: `${recipe.nutrition_info.nutrients.energy_kcal?.vd_percent ?? 0}%` },
                        { label: 'Carboidratos (g)', per100: `${recipe.nutrition_info.nutrients.carbs?.per_100g ?? 0}`, perServing: `${recipe.nutrition_info.nutrients.carbs?.per_serving ?? 0}`, vd: `${recipe.nutrition_info.nutrients.carbs?.vd_percent ?? 0}%` },
                        { label: 'Açúcares totais (g)', per100: `${recipe.nutrition_info.nutrients.total_sugars?.per_100g ?? 0}`, perServing: `${recipe.nutrition_info.nutrients.total_sugars?.per_serving ?? 0}`, vd: '—' },
                        { label: 'Açúcares adicionados (g)', per100: `${recipe.nutrition_info.nutrients.added_sugars?.per_100g ?? 0}`, perServing: `${recipe.nutrition_info.nutrients.added_sugars?.per_serving ?? 0}`, vd: `${recipe.nutrition_info.nutrients.added_sugars?.vd_percent ?? 0}%` },
                        { label: 'Proteínas (g)', per100: `${recipe.nutrition_info.nutrients.protein?.per_100g ?? 0}`, perServing: `${recipe.nutrition_info.nutrients.protein?.per_serving ?? 0}`, vd: `${recipe.nutrition_info.nutrients.protein?.vd_percent ?? 0}%` },
                        { label: 'Gorduras totais (g)', per100: `${recipe.nutrition_info.nutrients.fat?.per_100g ?? 0}`, perServing: `${recipe.nutrition_info.nutrients.fat?.per_serving ?? 0}`, vd: `${recipe.nutrition_info.nutrients.fat?.vd_percent ?? 0}%` },
                        { label: 'Gorduras saturadas (g)', per100: `${recipe.nutrition_info.nutrients.saturated_fat?.per_100g ?? 0}`, perServing: `${recipe.nutrition_info.nutrients.saturated_fat?.per_serving ?? 0}`, vd: `${recipe.nutrition_info.nutrients.saturated_fat?.vd_percent ?? 0}%` },
                        { label: 'Gorduras trans (g)', per100: `${recipe.nutrition_info.nutrients.trans_fat?.per_100g ?? 0}`, perServing: `${recipe.nutrition_info.nutrients.trans_fat?.per_serving ?? 0}`, vd: '—' },
                        { label: 'Fibra alimentar (g)', per100: `${recipe.nutrition_info.nutrients.fiber?.per_100g ?? 0}`, perServing: `${recipe.nutrition_info.nutrients.fiber?.per_serving ?? 0}`, vd: `${recipe.nutrition_info.nutrients.fiber?.vd_percent ?? 0}%` },
                        { label: 'Sódio (mg)', per100: `${recipe.nutrition_info.nutrients.sodium?.per_100g ?? 0}`, perServing: `${recipe.nutrition_info.nutrients.sodium?.per_serving ?? 0}`, vd: `${recipe.nutrition_info.nutrients.sodium?.vd_percent ?? 0}%` }
                      ] as const).map((n, idx) => {
                        const isSub = n.label.startsWith('Açúcares') || n.label.startsWith('Gorduras s') || n.label.startsWith('Gorduras t')
                        return (
                          <tr key={idx} className={cn("hover:bg-slate-50/50", isSub ? "bg-slate-50/20" : "")}>
                            <td className={cn("py-1.5 text-slate-800 font-semibold", isSub ? "pl-3 text-[10px] font-medium" : "")}>
                              {n.label}
                            </td>
                            <td className="py-1.5 text-right text-slate-600 font-mono pr-2">{n.per100}</td>
                            <td className="py-1.5 text-right text-slate-900 font-semibold font-mono pr-2">{n.perServing}</td>
                            <td className="py-1.5 text-right text-slate-900 font-bold font-mono">{n.vd}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                
                <p className="text-[9px] text-slate-400 mt-3 leading-relaxed pt-1.5 border-t border-slate-950">
                  * Percentual de valores diários fornecidos pela porção.
                  <br />
                  ** Valores aproximados. Os valores finais dependem da quantidade utilizada de itens definidos "a gosto".
                </p>
              </div>
            ) : (
              <div className="bg-surface-container rounded-2xl p-5 border" style={{ borderColor: 'var(--color-outline-variant)' }}>
                <h3 className="text-sm font-bold mb-4 flex items-center gap-2 uppercase tracking-widest text-on-surface">
                  <PillIcon className="h-4 w-4 text-fresh-green" />
                  Nutrição por Porção
                </h3>
                <div className="grid grid-cols-2 gap-3">
                   {[
                     { label: 'CALORIAS', val: recipe.calories_per_serving != null ? `${Math.round(recipe.calories_per_serving)} kcal` : '—' },
                     { label: 'PROTEÍNA', val: recipe.protein_per_serving != null ? `${recipe.protein_per_serving.toFixed(1)}g` : '—' },
                     { label: 'GORDURAS', val: recipe.fat_per_serving != null ? `${recipe.fat_per_serving.toFixed(1)}g` : '—' },
                     { label: 'CARBOS', val: recipe.carbs_per_serving != null ? `${recipe.carbs_per_serving.toFixed(1)}g` : '—' }
                   ].map(n => (
                     <div key={n.label} className="bg-white/50 p-3 rounded-xl border border-white">
                       <p className="text-[10px] font-bold text-neutral-400">{n.label}</p>
                       <p className={`text-sm font-bold ${n.val === '—' ? 'text-neutral-300' : 'text-primary'}`}>{n.val}</p>
                     </div>
                   ))}
                </div>
                {recipe.calories_per_serving == null ? (
                  <p className="text-[10px] text-neutral-400 mt-3 text-center">
                    Informações nutricionais ainda não disponíveis para esta receita.
                  </p>
                ) : (
                  <p className="text-[9px] text-neutral-400 mt-3 text-center leading-relaxed">
                    * Valores aproximados. Os valores finais dependem da quantidade utilizada de itens definidos "a gosto".
                  </p>
                )}
              </div>
            )}

            {/* Recipe Notes & Chef Tips */}
            {recipe.notes && recipe.notes.trim() !== '' && (
              <section className="bg-amber-50/70 border border-amber-200/80 rounded-3xl p-5 shadow-sm space-y-2">
                <div className="flex items-center gap-2 text-amber-900 border-b border-amber-200/60 pb-2">
                  <FileText className="h-4 w-4 text-amber-600 shrink-0" />
                  <h3 className="font-bold text-xs uppercase tracking-wider text-amber-950">
                    Notas & Dicas de Preparo
                  </h3>
                </div>
                <div
                  className="prose prose-sm max-w-none text-slate-800 text-xs leading-relaxed pt-1 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_strong]:font-semibold [&_strong]:text-amber-950 [&_em]:italic [&_u]:underline [&_a]:text-primary [&_a]:font-semibold [&_a]:underline [&_a]:underline-offset-2 [&_a:hover]:opacity-80"
                  dangerouslySetInnerHTML={{ __html: recipe.notes }}
                />
              </section>
            )}

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

          {/* Right Column: Audio Player & Tab Contents */}
          <div className="col-span-12 md:col-span-7 space-y-6">
            {/* Audio Player if not locked */}
            {!isLocked && (
              <section className="w-full">
                <AudioPlayerRecipe title={recipe.title} steps={recipe.steps ?? []} />
              </section>
            )}

            {/* Toggle Controls */}
            <section className="w-full">
              <div className="flex p-1 bg-neutral-100 rounded-xl">
                <button 
                  onClick={() => setActiveTab('ingredients')}
                  className={cn(
                    "flex-1 py-3 rounded-lg text-sm font-bold transition-all cursor-pointer",
                    activeTab === 'ingredients' ? "bg-white shadow-sm text-primary" : "text-neutral-400"
                  )}
                >
                  Ingredientes
                </button>
                <button 
                  onClick={() => setActiveTab('instructions')}
                  className={cn(
                    "flex-1 py-3 rounded-lg text-sm font-bold transition-all cursor-pointer",
                    activeTab === 'instructions' ? "bg-white shadow-sm text-primary" : "text-neutral-400"
                  )}
                >
                  Passos
                </button>
              </div>
            </section>

            {/* Content Canvas */}
            <div className="w-full">
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
                <div className="space-y-6">
                    {activeTab === 'ingredients' ? (
                      <RecipeIngredients 
                        ingredients={recipe.ingredients ?? []} 
                        servings={recipe.servings}
                        householdSize={preferences?.household_size}
                      />
                    ) : (
                      <RecipeSteps steps={recipe.steps ?? []} />
                    )}
                </div>
              )}
            </div>
            {/* Static Action Button */}
            {!isLocked && (
              <div className="pt-6 mt-6 border-t border-slate-200/60">
                <button 
                  onClick={() => {
                    setModalStep('weeks')
                    setSelectedWeekId(null)
                    setSelectedDayId(null)
                    setIsAddModalOpen(true)
                  }}
                  className="w-full bg-fresh-green text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg active:scale-95 hover:brightness-105 transition-all cursor-pointer"
                >
                  <Plus className="h-5 w-5" />
                  Adicionar ao Plano Semanal
                </button>
              </div>
            )}
          </div>

        </div>
      </main>

      {/* Dialog para Adicionar ao Plano Semanal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 text-left">
              {modalStep === 'weeks' && 'Adicionar ao Plano Semanal'}
              {modalStep === 'days' && 'Escolha o Dia da Semana'}
              {modalStep === 'slots' && 'Escolha a Refeição'}
            </DialogTitle>
            <DialogDescription className="text-left">
              {modalStep === 'weeks' && 'Selecione uma semana existente ou crie uma nova para planejar suas refeições.'}
              {modalStep === 'days' && `Planejando para a semana: ${selectedWeekTitle}`}
              {modalStep === 'slots' && `Adicionando em: ${selectedDayName}`}
            </DialogDescription>
          </DialogHeader>

          {/* PASSO 1: Selecionar Semana */}
          {modalStep === 'weeks' && (
            <div className="space-y-4 mt-2">
              <Button
                onClick={() => {
                  setIsAddModalOpen(false)
                  navigate('/app/semana/nova')
                }}
                className="w-full justify-start rounded-2xl py-6 border border-dashed border-primary/40 text-primary bg-primary/5 hover:bg-primary/10 gap-2.5 font-bold cursor-pointer"
              >
                <Plus className="h-5 w-5" />
                Criar Novo Plano Semanal
              </Button>

              <div className="text-xs font-black uppercase text-slate-400 tracking-wider pt-2">Planos Existentes</div>

              {isLoadingWeeks ? (
                <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : !weeks || weeks.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-4">Nenhum plano semanal ativo.</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {weeks.map(week => (
                    <button
                      key={week.id}
                      onClick={() => {
                        setSelectedWeekId(week.id)
                        setSelectedWeekTitle(week.title || `Semana de ${new Date(week.week_start_date).toLocaleDateString()}`)
                        setModalStep('days')
                      }}
                      className="w-full flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-slate-100/70 hover:border-slate-200 transition-all text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-slate-400" />
                        <div>
                          <p className="text-sm font-bold text-slate-800 line-clamp-1">{week.title || 'Plano Semanal'}</p>
                          <p className="text-[10px] text-slate-400">
                            {new Date(week.week_start_date).toLocaleDateString()} - {new Date(week.week_end_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PASSO 2: Selecionar Dia */}
          {modalStep === 'days' && (
            <div className="space-y-4 mt-2">
              <button
                onClick={() => setModalStep('weeks')}
                className="text-xs font-bold uppercase text-slate-500 hover:text-slate-700 flex items-center gap-1 cursor-pointer"
              >
                ← Voltar para as Semanas
              </button>

              {isLoadingDays ? (
                <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : !days || days.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-4">Nenhum dia configurado nesta semana.</p>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                  {days.map(day => (
                    <button
                      key={day.id}
                      onClick={() => {
                        setSelectedDayId(day.id)
                        setSelectedDayName(dayNames[day.day_of_week] || day.day_of_week)
                        setModalStep('slots')
                      }}
                      className="p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-slate-100 hover:border-slate-200 transition-all font-bold text-sm text-slate-700 uppercase tracking-wider text-center cursor-pointer"
                    >
                      {dayNames[day.day_of_week] || day.day_of_week}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PASSO 3: Selecionar Refeição */}
          {modalStep === 'slots' && (
            <div className="space-y-4 mt-2">
              <button
                onClick={() => setModalStep('days')}
                className="text-xs font-bold uppercase text-slate-500 hover:text-slate-700 flex items-center gap-1 cursor-pointer"
              >
                ← Voltar para os Dias
              </button>

              {isLoadingSlots ? (
                <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : !slots || slots.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-4">Nenhuma refeição configurada neste dia.</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {slots.map(slot => (
                    <button
                      key={slot.id}
                      onClick={() => handleAssignToSlot(slot.id)}
                      disabled={assignRecipe.isPending}
                      className="w-full flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-slate-100/70 hover:border-slate-200 transition-all text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className={cn("h-5 w-5", slot.recipe_id ? "text-primary fill-primary/10" : "text-slate-300")} />
                        <div>
                          <p className="text-sm font-bold text-slate-800">{mealNames[slot.meal_type] || slot.meal_type}</p>
                          {slot.recipe_id && (
                            <p className="text-[10px] text-slate-400">Substituirá a receita atual planejada</p>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
