import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Plus, Trash2, Image as ImageIcon, Sparkles, Loader2, Crown, UserCheck, Upload, X, FileText, ExternalLink, GripVertical, Link2 } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingState } from '@/components/shared/LoadingState'
import { useRecipe, useRecipeCategories, useRecipeTags } from '@/hooks/recipes/useRecipes'
import { Button } from '@/components/ui/button'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useQueryClient } from '@tanstack/react-query'
import { useGenerateNutrition } from '@/hooks/admin/useAIConfig'
import { StepEditor } from '@/components/shared/StepEditor'
import { RichTextEditor } from '@/components/shared/RichTextEditor'
import { RecipeLinkModal } from '@/components/shared/RecipeLinkModal'

const INGREDIENT_UNITS = [
  { value: "a gosto", label: "A gosto" },
  { value: "caixa", label: "Caixa(s)" },
  { value: "centilitro", label: "Centilitro (centilitro)" },
  { value: "centilitros", label: "Centilitros (centilitros)" },
  { value: "cl", label: "Centilitros (cl)" },
  { value: "centímetro", label: "Centímetro (centímetro)" },
  { value: "centímetros", label: "Centímetros (centímetros)" },
  { value: "cm", label: "Centímetro(s) (cm)" },
  { value: "colher (café)", label: "Colher (café)" },
  { value: "colher (chá)", label: "Colher (chá)" },
  { value: "colher (sobremesa)", label: "Colher (sobremesa)" },
  { value: "colher (sopa)", label: "Colher (sopa)" },
  { value: "colher de café", label: "Colher(es) de café" },
  { value: "colher de chá", label: "Colher(es) de chá" },
  { value: "colher de sobremesa", label: "Colher(es) de sobremesa" },
  { value: "colher de sopa", label: "Colher(es) de sopa" },
  { value: "colheres (café)", label: "Colheres (café)" },
  { value: "colheres (chá)", label: "Colheres (chá)" },
  { value: "colheres (sobremesa)", label: "Colheres (sobremesa)" },
  { value: "colheres (sopa)", label: "Colheres (sopa)" },
  { value: "copo", label: "Copo(s)" },
  { value: "decilitro", label: "Decilitro (decilitro)" },
  { value: "decilitros", label: "Decilitros (decilitros)" },
  { value: "dl", label: "Decilitros (dl)" },
  { value: "dente", label: "Dente(s)" },
  { value: "dentes", label: "Dentes (dentes)" },
  { value: "fatia", label: "Fatia(s)" },
  { value: "fatias", label: "Fatias (fatias)" },
  { value: "folha", label: "Folha(s)" },
  { value: "folhas", label: "Folhas (folhas)" },
  { value: "grama", label: "Grama (grama)" },
  { value: "g", label: "Gramas (g)" },
  { value: "gramas", label: "Gramas (gramas)" },
  { value: "lata", label: "Lata(s)" },
  { value: "liter", label: "Liter (liter)" },
  { value: "l", label: "Litros (l)" },
  { value: "litros", label: "Litros (litros)" },
  { value: "maço", label: "Maço(s)" },
  { value: "milligrama", label: "Miligrama (milligrama)" },
  { value: "mg", label: "Miligramas (mg)" },
  { value: "milligramas", label: "Miligramas (milligramas)" },
  { value: "millilitro", label: "Mililitro (millilitro)" },
  { value: "millilitros", label: "Mililitros (millilitros)" },
  { value: "ml", label: "Mililitros (ml)" },
  { value: "milímetro", label: "Milímetro (milímetro)" },
  { value: "milímetros", label: "Milímetros (milímetros)" },
  { value: "mm", label: "Milímetro(s) (mm)" },
  { value: "molho", label: "Molho (molho)" },
  { value: "molhos", label: "Molhos (molhos)" },
  { value: "pacote", label: "Pacote(s)" },
  { value: "pedaço", label: "Pedaço(s)" },
  { value: "pedaços", label: "Pedaços (pedaços)" },
  { value: "pitada", label: "Pitada(s)" },
  { value: "porção", label: "Porção (porção)" },
  { value: "quilo", label: "Quilo (quilo)" },
  { value: "kg", label: "Quilogramas (kg)" },
  { value: "quilos", label: "Quilos (quilos)" },
  { value: "ramo", label: "Ramo(s)" },
  { value: "unidade", label: "Unidade(s)" },
  { value: "vidro", label: "Vidro(s)" },
  { value: "xícara", label: "Xícara(s)" },
  { value: "xícaras", label: "Xícaras (xícaras)" },
  { value: "xícara de chá", label: "Xícara(s) de chá" }
]

/**
 * AdminRecipeEditorPage
 * 
 * Create/Edit form for Recipes.
 */
export function AdminRecipeEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = !id || id === 'nova'
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Note: useRecipe hook currently uses slug. Admin usually uses UUID.
  // I'll assume for admin we fetch by ID. 
  // For simplicity here, I'll fetch using raw supabase if it's an ID.
  const queryClient = useQueryClient()
  const generateNutrition = useGenerateNutrition()
  const [loading, setLoading] = useState(!isNew)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [recipeData, setRecipeData] = useState<any>({
    title: '',
    subtitle: '',
    difficulty_level: 'easy',
    cost_level: 'medium',
    prep_time_minutes: 30,
    servings: 2,
    status: 'draft',
    category_id: '',
    cover_image_url: '',
    is_premium: false,
    calories_per_serving: null,
    protein_per_serving: null,
    fat_per_serving: null,
    carbs_per_serving: null,
    nutrition_info: null,
    ingredients: [],
    steps: []
  })

  const [allCollections, setAllCollections] = useState<any[]>([])
  const [selectedCollections, setSelectedCollections] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [draggedStepIndex, setDraggedStepIndex] = useState<number | null>(null)
  /** Index of the ingredient currently waiting for a recipe link selection (-1 = none) */
  const [ingredientLinkIndex, setIngredientLinkIndex] = useState<number>(-1)

  const { data: categories } = useRecipeCategories()
  const { data: allTags, isLoading: isLoadingTags } = useRecipeTags()
  const [creatorProfile, setCreatorProfile] = useState<{ full_name: string | null; role: string | null } | null>(null)

  useEffect(() => {
    const loadData = async () => {
      // Fetch all collections
      const { data: colls } = await supabase
        .from('recipe_collections')
        .select('*')
        .order('sort_order')
      if (colls) setAllCollections(colls)

      if (!isNew) {
        setLoading(true)
        const { data, error } = await supabase
          .from('recipes')
          .select('*, ingredients:recipe_ingredients!recipe_ingredients_recipe_id_fkey(*), steps:recipe_steps(*), tags:recipe_tag_links(tag:recipe_tags(*)), creator:profiles!created_by(id, full_name, role)')
          .eq('id', id)
          .single()

        if (error) {
          toast.error('Não foi possível carregar os dados internos da receita.')
          setLoading(false)
          return
        }
        
        if (data) {
          const { creator, tags, ...rest } = data as any
          setRecipeData(rest)
          if (creator && creator.role !== 'admin' && creator.role !== 'super_admin') {
            setCreatorProfile(creator)
          }
          if (tags && tags.length > 0) {
            setSelectedTags(tags.map((t: any) => t.tag.id))
          }
        }

        // Fetch current collection associations
        const { data: items } = await supabase
          .from('recipe_collection_items')
          .select('collection_id')
          .eq('recipe_id', id)
        
        if (items) {
          setSelectedCollections(items.map((item: any) => item.collection_id))
        }
        setLoading(false)
      }
    }
    loadData()
  }, [id, isNew])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione um arquivo de imagem válido (JPG, PNG, WebP).')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB')
      return
    }

    try {
      setIsUploadingImage(true)
      const fileExt = file.name.split('.').pop() || 'jpg'
      const fileName = `recipes/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('system')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('system')
        .getPublicUrl(fileName)

      setRecipeData((prev: any) => ({ ...prev, cover_image_url: publicUrl }))
      toast.success('Imagem enviada com sucesso!')
    } catch (err: any) {
      console.error('Erro ao fazer upload da imagem:', err)
      toast.error(err.message || 'Erro ao fazer upload da imagem')
    } finally {
      setIsUploadingImage(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDragStepStart = (e: React.DragEvent, index: number) => {
    setDraggedStepIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragStepOver = (e: React.DragEvent, hoverIndex: number) => {
    e.preventDefault()
    if (draggedStepIndex === null || draggedStepIndex === hoverIndex) return

    const updatedSteps = [...(recipeData.steps || [])]
    const draggedStep = updatedSteps[draggedStepIndex]
    
    updatedSteps.splice(draggedStepIndex, 1)
    updatedSteps.splice(hoverIndex, 0, draggedStep)
    
    const renumbered = updatedSteps.map((s, idx) => ({
      ...s,
      step_number: idx + 1
    }))
    
    setDraggedStepIndex(hoverIndex)
    setRecipeData((prev: any) => ({ ...prev, steps: renumbered }))
  }

  const handleDragStepEnd = () => {
    setDraggedStepIndex(null)
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const { ingredients, steps, ...cleanData } = recipeData
      
      // 1. Save Basic Recipe Info
      const { data: savedRecipe, error: recipeError } = isNew 
        ? await supabase.from('recipes').insert(cleanData).select().single()
        : await supabase.from('recipes').update(cleanData).eq('id', id).select().single()

      if (recipeError) throw recipeError
      const recipeId = savedRecipe.id

      // 2. Sync Ingredients
      // Delete existing
      await supabase.from('recipe_ingredients').delete().eq('recipe_id', recipeId)
      // Insert new
      if (ingredients && ingredients.length > 0) {
        const ingredientsToInsert = ingredients.map((ing: any, idx: number) => ({
          recipe_id: recipeId,
          name: ing.name,
          quantity_label: ing.quantity_label,
          unit: ing.unit || null,
          linked_recipe_id: ing.linked_recipe_id || null,
          sort_order: idx
        }))
        const { error: ingError } = await supabase.from('recipe_ingredients').insert(ingredientsToInsert)
        if (ingError) throw ingError
      }

      // 3. Sync Steps
      // Delete existing
      await supabase.from('recipe_steps').delete().eq('recipe_id', recipeId)
      // Insert new
      if (steps && steps.length > 0) {
        const stepsToInsert = steps.map((s: any, idx: number) => ({
          recipe_id: recipeId,
          content: s.content,
          step_number: idx + 1
        }))
        const { error: stepError } = await supabase.from('recipe_steps').insert(stepsToInsert)
        if (stepError) throw stepError
      }

      // 4. Sync Collections
      const { error: collDeleteError } = await supabase
        .from('recipe_collection_items')
        .delete()
        .eq('recipe_id', recipeId)
      if (collDeleteError) throw collDeleteError

      if (selectedCollections.length > 0) {
        const itemsToInsert = selectedCollections.map(collId => ({
          collection_id: collId,
          recipe_id: recipeId
        }))
        const { error: collInsertError } = await supabase
          .from('recipe_collection_items')
          .insert(itemsToInsert)
        if (collInsertError) throw collInsertError
      }

      // Sync tags
      const { error: tagDeleteError } = await supabase
        .from('recipe_tag_links')
        .delete()
        .eq('recipe_id', recipeId)
      if (tagDeleteError) throw tagDeleteError

      if (selectedTags.length > 0) {
        const tagsToInsert = selectedTags.map(tagId => ({
          recipe_id: recipeId,
          tag_id: tagId
        }))
        const { error: tagInsertError } = await supabase
          .from('recipe_tag_links')
          .insert(tagsToInsert)
        if (tagInsertError) throw tagInsertError
      }

      // 5. Auto-generate nutrition for NEW recipes with ingredients
      if (isNew && ingredients && ingredients.length > 0) {
        toast.info('Gerando tabela nutricional com IA...', { id: 'auto-nutrition' })
        try {
          const { data: nutritionResult, error: nutritionError } = await supabase.functions.invoke('generate-nutrition', {
            body: {
              ingredients: ingredients.map((ing: any) => ({
                name: ing.name,
                quantity_label: ing.quantity_label || null,
                unit: ing.unit || null
              })),
              servings: recipeData.servings || 1
            }
          })

          if (!nutritionError && nutritionResult?.data) {
            await supabase
              .from('recipes')
              .update({ nutrition_info: nutritionResult.data })
              .eq('id', recipeId)
            toast.success('Tabela nutricional gerada automaticamente!', { id: 'auto-nutrition' })
          } else {
            console.warn('Auto-nutrition skipped:', nutritionError || nutritionResult?.error)
            toast.dismiss('auto-nutrition')
          }
        } catch (nutritionErr) {
          console.warn('Auto-nutrition failed (non-blocking):', nutritionErr)
          toast.dismiss('auto-nutrition')
        }
      }

      queryClient.invalidateQueries({ queryKey: ['recipes'] })
      queryClient.invalidateQueries({ queryKey: ['recipe'] })
      queryClient.invalidateQueries({ queryKey: ['recipe-collections'] })
      queryClient.invalidateQueries({ queryKey: ['collection'] })

      toast.success('Receita salva com sucesso!')
      if (isNew) navigate(`/admin/receitas/${recipeId}`)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao salvar receita')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingState message="Preparando formulário..." />

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-20">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/admin/receitas')} className="flex items-center gap-2 text-sm font-semibold text-primary hover:opacity-80 cursor-pointer">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>
        <div className="flex items-center gap-3">
          {!isNew && recipeData.slug && (
            <Button
              type="button"
              variant="outline"
              onClick={() => window.open(`/app/receitas/${recipeData.slug}`, '_blank')}
              className="gap-2 border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <ExternalLink className="h-4 w-4 text-primary" />
              Visualizar no Site
            </Button>
          )}
          <Button onClick={handleSave} className="gap-2 px-8 cursor-pointer">
            <Save className="h-4 w-4" />
            Salvar Receita
          </Button>
        </div>
      </div>

      <PageHeader title={isNew ? "Nova Receita" : "Editar Receita"} />

      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6 rounded-2xl border bg-white p-6 shadow-sm">
          <h3 className="font-bold border-b pb-2 mb-4">Informações Básicas</h3>

          {/* Importer badge */}
          {creatorProfile && (
            <div className="flex items-center gap-2 px-3 py-2 bg-sky-50 border border-sky-100 rounded-xl text-sky-700 mb-2">
              <UserCheck className="h-4 w-4 shrink-0 text-sky-500" />
              <span className="text-xs font-semibold">Importada por: <span className="font-bold">{creatorProfile.full_name || 'Usuário'}</span></span>
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Título da Receita</label>
            <input
              type="text"
              value={recipeData.title}
              onChange={(e) => setRecipeData({...recipeData, title: e.target.value})}
              className="w-full rounded-lg border p-2 focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Categoria</label>
            <select
              value={recipeData.category_id || ''}
              onChange={(e) => setRecipeData({...recipeData, category_id: e.target.value})}
              className="w-full rounded-lg border p-2 focus:ring-2 focus:ring-primary outline-none bg-white"
            >
              <option value="">Selecione uma categoria</option>
              {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tempo (min)</label>
              <input
                type="number"
                value={recipeData.prep_time_minutes}
                onChange={(e) => setRecipeData({...recipeData, prep_time_minutes: parseInt(e.target.value)})}
                className="w-full rounded-lg border p-2 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Porções</label>
              <input
                type="number"
                value={recipeData.servings}
                onChange={(e) => setRecipeData({...recipeData, servings: parseInt(e.target.value)})}
                className="w-full rounded-lg border p-2 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Dificuldade</label>
              <select
                value={recipeData.difficulty_level || 'easy'}
                onChange={(e) => setRecipeData({...recipeData, difficulty_level: e.target.value})}
                className="w-full rounded-lg border p-2 outline-none bg-white"
              >
                <option value="easy">Fácil</option>
                <option value="medium">Médio</option>
                <option value="hard">Difícil</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Nível de Custo</label>
              <select
                value={recipeData.cost_level || 'medium'}
                onChange={(e) => setRecipeData({...recipeData, cost_level: e.target.value})}
                className="w-full rounded-lg border p-2 outline-none bg-white"
              >
                <option value="low">Econômico</option>
                <option value="medium">Moderado</option>
                <option value="high">Premium</option>
              </select>
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t border-slate-100">
            <label className="text-sm font-medium">Tags da Receita</label>
            {isLoadingTags ? (
              <div className="flex items-center gap-2 text-xs text-slate-400 py-1">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                <span>Carregando tags...</span>
              </div>
            ) : !allTags || allTags.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Nenhuma tag cadastrada.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {allTags.map(tag => {
                  const isChecked = selectedTags.includes(tag.id)
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => {
                        if (isChecked) {
                          setSelectedTags(selectedTags.filter(id => id !== tag.id))
                        } else {
                          setSelectedTags([...selectedTags, tag.id])
                        }
                      }}
                      className={cn(
                        "px-2.5 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer select-none active:scale-95",
                        isChecked
                          ? "bg-primary/10 border-primary text-primary shadow-sm"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300"
                      )}
                    >
                      {tag.name}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Media & Status */}
        <div className="space-y-6 rounded-2xl border bg-white p-6 shadow-sm">
          <h3 className="font-bold border-b pb-2 mb-4">Status & Mídia</h3>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
            disabled={isUploadingImage}
          />

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Imagem de Capa da Receita</label>
            <div 
              onClick={() => !isUploadingImage && fileInputRef.current?.click()}
              className={cn(
                "relative group aspect-video rounded-xl bg-slate-50 border-2 border-dashed border-slate-200 hover:border-primary/50 transition-all flex flex-col items-center justify-center text-slate-400 gap-2 overflow-hidden cursor-pointer",
                isUploadingImage && "pointer-events-none opacity-80"
              )}
            >
              {isUploadingImage ? (
                <div className="flex flex-col items-center gap-2 text-primary">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="text-xs font-semibold">Enviando imagem...</span>
                </div>
              ) : recipeData.cover_image_url ? (
                <>
                  <img src={recipeData.cover_image_url} alt="Capa da receita" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        fileInputRef.current?.click()
                      }}
                      className="rounded-lg text-xs flex items-center gap-1 bg-white/90 hover:bg-white text-slate-800"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Trocar Imagem
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setRecipeData((prev: any) => ({ ...prev, cover_image_url: '' }))
                      }}
                      className="rounded-lg text-xs flex items-center gap-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remover
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-3 rounded-full bg-slate-100 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <Upload className="h-6 w-6" />
                  </div>
                  <div className="text-center px-4">
                    <p className="text-xs font-semibold text-slate-700 group-hover:text-primary transition-colors">
                      Clique para fazer upload da imagem
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">PNG, JPG, WEBP até 5MB</p>
                  </div>
                </>
              )}
            </div>

            <div className="space-y-1 pt-2">
              <label className="text-xs font-medium text-slate-500">Ou informe a URL da imagem diretamente:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={recipeData.cover_image_url || ''}
                  onChange={(e) => setRecipeData({ ...recipeData, cover_image_url: e.target.value })}
                  placeholder="https://exemplo.com/imagem-receita.jpg"
                  className="flex-1 rounded-lg border border-slate-200 p-2 text-xs outline-none focus:ring-1 focus:ring-primary bg-slate-50/50"
                />
                {recipeData.cover_image_url && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setRecipeData({ ...recipeData, cover_image_url: '' })}
                    className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50 shrink-0"
                  >
                    Limpar
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Status de Publicação</label>
            <div className="flex gap-2">
              {['draft', 'published'].map(s => (
                <button
                  key={s}
                  onClick={() => setRecipeData({...recipeData, status: s})}
                  className={cn(
                    "flex-1 py-2 rounded-lg border text-sm font-bold uppercase transition-all cursor-pointer",
                    recipeData.status === s ? "bg-primary text-white border-primary" : "bg-white hover:bg-slate-50 text-slate-500"
                  )}
                >
                  {s === 'draft' ? 'Rascunho' : 'Publicado'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
            <input
              id="is_premium"
              type="checkbox"
              checked={recipeData.is_premium || false}
              onChange={(e) => setRecipeData({...recipeData, is_premium: e.target.checked})}
              className="rounded border-slate-300 text-primary focus:ring-primary h-5 w-5 cursor-pointer"
            />
            <label htmlFor="is_premium" className="text-sm font-semibold text-slate-800 cursor-pointer flex items-center gap-1.5">
              <Crown className="h-4 w-4 text-amber-500" />
              Esta é uma Receita Premium (Exclusiva Pro)
            </label>
          </div>

          <div className="space-y-2 pt-4 border-t border-slate-100">
            <label className="text-sm font-medium">Coleções Editoriais</label>
            {allCollections.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Nenhuma coleção cadastrada.</p>
            ) : (
              <div className="grid grid-cols-1 gap-2 mt-2 max-h-48 overflow-y-auto pr-1">
                {allCollections.map(coll => {
                  const isChecked = selectedCollections.includes(coll.id)
                  return (
                    <label key={coll.id} className="flex items-center gap-2.5 text-sm cursor-pointer p-1.5 hover:bg-slate-50 rounded-lg transition-colors">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCollections([...selectedCollections, coll.id])
                          } else {
                            setSelectedCollections(selectedCollections.filter(id => id !== coll.id))
                          }
                        }}
                        className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4"
                      />
                      <span className="font-medium text-slate-700">{coll.title}</span>
                      {coll.is_premium && (
                        <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded uppercase">P</span>
                      )}
                    </label>
                  )
                })}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Ingredients Management */}
      <div className="space-y-6 rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b pb-2 mb-4">
          <h3 className="font-bold">Ingredientes</h3>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setRecipeData({
              ...recipeData, 
              ingredients: [...(recipeData.ingredients || []), { name: '', quantity_label: '', unit: '', sort_order: (recipeData.ingredients?.length || 0) }]
            })}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Adicionar
          </Button>
        </div>
        
        <div className="space-y-3">
          {recipeData.ingredients?.map((ing: any, index: number) => (
            <div key={index} className="space-y-1.5">
              <div className="flex gap-3 items-start">
                <div className="flex-1">
                  <input
                    placeholder="Nome do ingrediente"
                    value={ing.name}
                    onChange={(e) => {
                      const newIngs = [...recipeData.ingredients]
                      newIngs[index].name = e.target.value
                      setRecipeData({...recipeData, ingredients: newIngs})
                    }}
                    className="w-full rounded-lg border p-2 text-sm outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="w-28">
                  <input
                    placeholder="Qtd (Ex: 200)"
                    value={ing.quantity_label || ''}
                    onChange={(e) => {
                      const newIngs = [...recipeData.ingredients]
                      newIngs[index].quantity_label = e.target.value
                      setRecipeData({...recipeData, ingredients: newIngs})
                    }}
                    className="w-full rounded-lg border p-2 text-sm outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="w-40">
                  <select
                    value={ing.unit || ''}
                    onChange={(e) => {
                      const newIngs = [...recipeData.ingredients]
                      newIngs[index].unit = e.target.value || null
                      setRecipeData({...recipeData, ingredients: newIngs})
                    }}
                    className="w-full rounded-lg border p-2 text-sm outline-none focus:ring-1 focus:ring-primary bg-white cursor-pointer"
                  >
                    <option value="">Sem unidade</option>
                    {INGREDIENT_UNITS.map(unit => (
                      <option key={unit.value} value={unit.value}>
                        {unit.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Link to recipe button */}
                <button
                  type="button"
                  title={ing.linked_recipe_id ? 'Remover vínculo com receita' : 'Vincular a uma receita-base'}
                  onClick={() => {
                    if (ing.linked_recipe_id) {
                      // Remove link
                      const newIngs = [...recipeData.ingredients]
                      newIngs[index] = { ...newIngs[index], linked_recipe_id: null, linked_recipe: null }
                      setRecipeData({ ...recipeData, ingredients: newIngs })
                    } else {
                      setIngredientLinkIndex(index)
                    }
                  }}
                  className={cn(
                    'p-2 rounded-lg transition-colors shrink-0',
                    ing.linked_recipe_id
                      ? 'text-primary bg-primary/10 hover:bg-red-50 hover:text-red-500'
                      : 'text-slate-400 hover:text-primary hover:bg-primary/10'
                  )}
                >
                  <Link2 className="h-4 w-4" />
                </button>

                <button 
                  onClick={() => {
                    const newIngs = recipeData.ingredients.filter((_: any, i: number) => i !== index)
                    setRecipeData({...recipeData, ingredients: newIngs})
                  }}
                  className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Linked recipe badge */}
              {ing.linked_recipe_id && ing.linked_recipe && (
                <div className="ml-1 flex items-center gap-1.5">
                  <Link2 className="h-3 w-3 text-primary shrink-0" />
                  <span className="text-xs text-primary font-medium">
                    Receita base: <strong>{ing.linked_recipe.title}</strong>
                  </span>
                </div>
              )}
              {ing.linked_recipe_id && !ing.linked_recipe && (
                <div className="ml-1 flex items-center gap-1.5">
                  <Link2 className="h-3 w-3 text-primary shrink-0" />
                  <span className="text-xs text-primary font-medium">Receita base vinculada</span>
                </div>
              )}
            </div>
          ))}
          {(!recipeData.ingredients || recipeData.ingredients.length === 0) && (
            <p className="text-center py-4 text-slate-400 text-sm italic">Nenhum ingrediente adicionado.</p>
          )}
        </div>
      </div>

      {/* Nutritional Table */}
      <div className="space-y-6 rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b pb-4 mb-4">
          <div>
            <h3 className="font-bold">Tabela Nutricional (Padrão ANVISA)</h3>
            <p className="text-xs text-slate-400 mt-0.5">Preencha os valores da porção ou gere automaticamente com a inteligência artificial.</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              if (!recipeData.ingredients || recipeData.ingredients.length === 0) {
                toast.error('Adicione ingredientes antes de gerar a tabela nutricional.')
                return
              }
              try {
                const result = await generateNutrition.mutateAsync({
                  ingredients: recipeData.ingredients.map((i: any) => ({
                    name: i.name,
                    quantity_label: i.quantity_label || null,
                    unit: i.unit || null
                  })),
                  servings: recipeData.servings || 1
                })

                setRecipeData((prev: any) => ({
                  ...prev,
                  calories_per_serving: result.nutrients.energy_kcal.per_serving,
                  protein_per_serving: result.nutrients.protein.per_serving,
                  fat_per_serving: result.nutrients.fat.per_serving,
                  carbs_per_serving: result.nutrients.carbs.per_serving,
                  nutrition_info: {
                    serving_size_g_ml: result.serving_size_g_ml,
                    serving_size_household: result.serving_size_household,
                    nutrients: result.nutrients
                  }
                }))
                toast.success(`Tabela gerada com sucesso via ${result.provider === 'openai' ? 'OpenAI GPT' : 'Google Gemini'}! Revise os valores antes de salvar.`)
              } catch {
                // error handled in hook
              }
            }}
            disabled={generateNutrition.isPending}
            className="gap-2 border-primary/30 text-primary hover:bg-primary/5"
          >
            {generateNutrition.isPending
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Gerando...</>
              : <><Sparkles className="h-4 w-4" /> Gerar com IA</>}
          </Button>
        </div>

        {/* Portion Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Peso/Volume da Porção (g ou ml)</label>
            <input
              type="number"
              min="1"
              value={recipeData.nutrition_info?.serving_size_g_ml ?? ''}
              onChange={e => {
                const val = e.target.value === '' ? 100 : parseInt(e.target.value)
                setRecipeData((prev: any) => ({
                  ...prev,
                  nutrition_info: {
                    ...prev.nutrition_info,
                    serving_size_g_ml: val
                  }
                }))
              }}
              placeholder="Ex: 150"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Medida Caseira da Porção</label>
            <input
              type="text"
              value={recipeData.nutrition_info?.serving_size_household ?? ''}
              onChange={e => {
                setRecipeData((prev: any) => ({
                  ...prev,
                  nutrition_info: {
                    ...prev.nutrition_info,
                    serving_size_household: e.target.value
                  }
                }))
              }}
              placeholder="Ex: 1 fatia, 1 xícara de chá, 1 concha"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
        </div>

        {/* Nutrients Grid / Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 mt-4">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-3 font-bold text-slate-500 border-b text-[11px] uppercase tracking-wider">Nutriente</th>
                <th className="p-3 font-bold text-slate-500 border-b w-1/4 text-[11px] uppercase tracking-wider">Por 100 g/ml</th>
                <th className="p-3 font-bold text-slate-500 border-b w-1/4 text-[11px] uppercase tracking-wider">Por Porção</th>
                <th className="p-3 font-bold text-slate-500 border-b w-1/4 text-[11px] uppercase tracking-wider">%VD*</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {([
                { label: 'Valor energético (kcal)', field: 'energy_kcal', placeholder: 'Ex: 342' },
                { label: 'Valor energético (kJ)', field: 'energy_kj', placeholder: 'Ex: 1431' },
                { label: 'Carboidratos (g)', field: 'carbs', placeholder: 'Ex: 12' },
                { label: 'Açúcares totais (g)', field: 'total_sugars', placeholder: 'Ex: 5' },
                { label: 'Açúcares adicionados (g)', field: 'added_sugars', placeholder: 'Ex: 2' },
                { label: 'Proteínas (g)', field: 'protein', placeholder: 'Ex: 28' },
                { label: 'Gorduras totais (g)', field: 'fat', placeholder: 'Ex: 18' },
                { label: 'Gorduras saturadas (g)', field: 'saturated_fat', placeholder: 'Ex: 5' },
                { label: 'Gorduras trans (g)', field: 'trans_fat', placeholder: 'Ex: 0' },
                { label: 'Fibra alimentar (g)', field: 'fiber', placeholder: 'Ex: 3' },
                { label: 'Sódio (mg)', field: 'sodium', placeholder: 'Ex: 120' }
              ] as const).map(({ label, field, placeholder }) => {
                const handleNutrientChange = (type: 'per_100g' | 'per_serving' | 'vd_percent', value: string) => {
                  const parsedVal = value === '' ? null : parseFloat(value)
                  const nutrition = recipeData.nutrition_info || { serving_size_g_ml: 100, serving_size_household: '1 porção', nutrients: {} }
                  const nutrients = { ...nutrition.nutrients } as any
                  
                  nutrients[field] = { ...(nutrients[field] || { per_100g: 0, per_serving: 0, vd_percent: null }) }
                  nutrients[field][type] = parsedVal

                  // Auto-calculation logic:
                  // 1. Calculate kJ if kcal changes
                  if (field === 'energy_kcal') {
                    nutrients.energy_kj = { ...(nutrients.energy_kj || { per_100g: 0, per_serving: 0, vd_percent: null }) }
                    if (parsedVal !== null) {
                      if (type === 'per_serving') {
                        nutrients.energy_kj.per_serving = Math.round(parsedVal * 4.184)
                        nutrients.energy_kj.vd_percent = Math.round((nutrients.energy_kj.per_serving / 8400) * 100)
                      } else if (type === 'per_100g') {
                        nutrients.energy_kj.per_100g = Math.round(parsedVal * 4.184)
                      }
                    } else {
                      nutrients.energy_kj[type] = null
                    }
                  }

                  // 2. Auto-calculate %VD from per_serving
                  const vdRefs: Record<string, number> = {
                    energy_kcal: 2000,
                    energy_kj: 8400,
                    carbs: 300,
                    added_sugars: 50,
                    protein: 50,
                    fat: 65,
                    saturated_fat: 22,
                    fiber: 25,
                    sodium: 2000
                  }

                  if (type === 'per_serving' && vdRefs[field]) {
                    if (parsedVal !== null) {
                      nutrients[field].vd_percent = Math.round((parsedVal / vdRefs[field]) * 100)
                    } else {
                      nutrients[field].vd_percent = null
                    }
                  }

                  // 3. Auto-calculate per_100g if per_serving exists
                  const size = nutrition.serving_size_g_ml || 100
                  if (type === 'per_serving' && size > 0 && parsedVal !== null) {
                    const isEnergy = field.startsWith('energy_')
                    const calc100g = (parsedVal / size) * 100
                    nutrients[field].per_100g = isEnergy ? Math.round(calc100g) : Math.round(calc100g * 10) / 10
                  }

                  // Sync legacy top-level fields for compatibility
                  let legacyFields: any = {}
                  if (field === 'energy_kcal' && type === 'per_serving') legacyFields.calories_per_serving = parsedVal
                  if (field === 'protein' && type === 'per_serving') legacyFields.protein_per_serving = parsedVal
                  if (field === 'fat' && type === 'per_serving') legacyFields.fat_per_serving = parsedVal
                  if (field === 'carbs' && type === 'per_serving') legacyFields.carbs_per_serving = parsedVal

                  setRecipeData((prev: any) => ({
                    ...prev,
                    ...legacyFields,
                    nutrition_info: {
                      ...nutrition,
                      nutrients
                    }
                  }))
                }

                return (
                  <tr key={field}>
                    <td className="p-3 font-medium text-slate-700 text-xs">{label}</td>
                    <td className="p-1.5">
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={recipeData.nutrition_info?.nutrients?.[field]?.per_100g ?? ''}
                        onChange={e => handleNutrientChange('per_100g', e.target.value)}
                        placeholder={placeholder}
                        className="w-full rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-mono outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-slate-50/50"
                      />
                    </td>
                    <td className="p-1.5">
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={recipeData.nutrition_info?.nutrients?.[field]?.per_serving ?? ''}
                        onChange={e => handleNutrientChange('per_serving', e.target.value)}
                        placeholder={placeholder}
                        className="w-full rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-mono outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </td>
                    <td className="p-1.5">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={recipeData.nutrition_info?.nutrients?.[field]?.vd_percent ?? ''}
                          onChange={e => handleNutrientChange('vd_percent', e.target.value)}
                          placeholder="Ex: 5"
                          disabled={field === 'total_sugars' || field === 'trans_fat'}
                          className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-xs font-mono outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:bg-slate-100 disabled:text-slate-400"
                        />
                        <span className="text-[10px] text-slate-400">%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {generateNutrition.isPending && (
          <div className="flex items-center gap-2 text-xs text-slate-400 animate-pulse mt-2">
            <Sparkles className="h-3 w-3 text-primary" />
            Analisando ingredientes com IA no padrão ANVISA... isso pode levar alguns segundos.
          </div>
        )}
      </div>

      {/* Steps Management */}
      <div className="space-y-6 rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b pb-2 mb-4">
          <h3 className="font-bold">Modo de Preparo</h3>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setRecipeData({
              ...recipeData, 
              steps: [...(recipeData.steps || []), { content: '', step_number: (recipeData.steps?.length || 0) + 1 }]
            })}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Adicionar Passo
          </Button>
        </div>
        
        <div className="space-y-4">
          {recipeData.steps?.sort((a: any, b: any) => a.step_number - b.step_number).map((step: any, index: number) => {
            const isDragged = draggedStepIndex === index
            return (
              <div
                key={index}
                draggable
                onDragStart={(e) => handleDragStepStart(e, index)}
                onDragOver={(e) => handleDragStepOver(e, index)}
                onDragEnd={handleDragStepEnd}
                className={cn(
                  "flex gap-4 items-start p-2 border border-transparent rounded-2xl transition-all",
                  isDragged
                    ? "opacity-30 border-dashed border-primary bg-primary/5 scale-[0.98]"
                    : "hover:bg-slate-50/50"
                )}
              >
                {/* Drag handle & step number badge */}
                <div className="flex items-center gap-1.5 shrink-0 select-none pt-2 text-slate-400 cursor-grab active:cursor-grabbing">
                  <GripVertical className="h-4 w-4 shrink-0" />
                  <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                    {index + 1}
                  </div>
                </div>

                {/* Rich text editor */}
                <div className="flex-1">
                  <StepEditor
                    value={step.content}
                    onChange={(html) => {
                      const newSteps = [...recipeData.steps]
                      newSteps[index] = { ...newSteps[index], content: html }
                      setRecipeData({ ...recipeData, steps: newSteps })
                    }}
                    placeholder={`Descreva o passo ${index + 1}...`}
                  />
                </div>

                {/* Delete button */}
                <button
                  type="button"
                  onClick={() => {
                    const newSteps = recipeData.steps.filter((_: any, i: number) => i !== index)
                    const renumbered = newSteps.map((s: any, i: number) => ({ ...s, step_number: i + 1 }))
                    setRecipeData({ ...recipeData, steps: renumbered })
                  }}
                  className="p-2 text-slate-400 hover:text-red-500 transition-colors mt-2"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )
          })}
          {(!recipeData.steps || recipeData.steps.length === 0) && (
            <p className="text-center py-4 text-slate-400 text-sm italic">Nenhum passo adicionado.</p>
          )}
        </div>
      </div>

      {/* Recipe Notes & Chef Tips */}
      <div className="space-y-4 rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 border-b pb-2 mb-2">
          <FileText className="h-5 w-5 text-primary" />
          <h3 className="font-bold">Notas & Dicas da Receita</h3>
        </div>
        <p className="text-xs text-slate-500 mb-2">
          Adicione segredos do chefe, dicas de conservação, sugestões de harmonização ou observações importantes sobre esta preparação.
        </p>
        <RichTextEditor
          value={recipeData.notes || ''}
          onChange={(html) => setRecipeData((prev: any) => ({ ...prev, notes: html }))}
          placeholder="Escreva aqui as notas, dicas ou observações da receita..."
          minHeight="140px"
          enableRecipeLinks
        />
      </div>

      {/* ── Bottom Save Bar ─────────────────────────────────────── */}
      <div className="flex items-center justify-between rounded-2xl border bg-white p-4 shadow-sm">
        <p className="text-sm text-slate-400">
          Revise os campos acima antes de salvar.
        </p>
        <div className="flex items-center gap-3">
          {!isNew && recipeData.slug && (
            <Button
              type="button"
              variant="outline"
              onClick={() => window.open(`/app/receitas/${recipeData.slug}`, '_blank')}
              className="gap-2 border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <ExternalLink className="h-4 w-4 text-primary" />
              Visualizar no Site
            </Button>
          )}
          <Button onClick={handleSave} className="gap-2 px-8 cursor-pointer">
            <Save className="h-4 w-4" />
            Salvar Receita
          </Button>
        </div>
      </div>

      {/* Recipe Link Modal — for ingredient linking */}
      <RecipeLinkModal
        open={ingredientLinkIndex >= 0}
        title="Vincular Receita-Base ao Ingrediente"
        onClose={() => setIngredientLinkIndex(-1)}
        onSelect={(recipe) => {
          if (ingredientLinkIndex < 0) return
          const newIngs = [...recipeData.ingredients]
          newIngs[ingredientLinkIndex] = {
            ...newIngs[ingredientLinkIndex],
            linked_recipe_id: recipe.id,
            linked_recipe: recipe,
          }
          setRecipeData({ ...recipeData, ingredients: newIngs })
          setIngredientLinkIndex(-1)
        }}
      />
    </div>
  )
}
