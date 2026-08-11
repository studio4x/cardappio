import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Save, Loader2, Image as ImageIcon, Upload, FileText, ExternalLink, GripVertical } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { useRecipeCategories, useRecipeTags } from '@/hooks/recipes/useRecipes'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/app/providers/AuthProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { RichTextEditor } from '@/components/shared/RichTextEditor'
import { useMeasurementUnits } from '@/hooks/recipes/useMeasurementUnits'

export function UserRecipeEditorPage() {
  const { units: INGREDIENT_UNITS } = useMeasurementUnits()
  const { id } = useParams()
  const navigate = useNavigate()
  const { supabaseUser, user } = useAuth()
  const { data: categories } = useRecipeCategories()
  const { data: allTags, isLoading: isLoadingTags } = useRecipeTags()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isLoading, setIsLoading] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [recipeSlug, setRecipeSlug] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [notes, setNotes] = useState('')
  const [prepTime, setPrepTime] = useState(30)
  const [servings, setServings] = useState(4)
  const [categoryId, setCategoryId] = useState('')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy')
  const [cost, setCost] = useState<'low' | 'medium' | 'high'>('medium')
  
  // Ingredients list
  const [ingredients, setIngredients] = useState<{ name: string; quantity: string; unit: string }[]>([
    { name: '', quantity: '', unit: '' }
  ])

  // Steps list
  const [steps, setSteps] = useState<string[]>([''])

  useEffect(() => {
    if (id) {
      // Load editing data
      const loadRecipe = async () => {
        setIsLoading(true)
        try {
          const { data: recipe, error: recipeError } = await supabase
            .from('recipes')
            .select('*, ingredients:recipe_ingredients!recipe_ingredients_recipe_id_fkey(*), steps:recipe_steps(*), tags:recipe_tag_links(tag:recipe_tags(*))')
            .eq('id', id)
            .single()

          if (recipeError) throw recipeError
          if (recipe) {
            setTitle(recipe.title)
            setSubtitle(recipe.subtitle || '')
            setNotes(recipe.notes || '')
            setCoverImageUrl(recipe.cover_image_url || '')
            setRecipeSlug(recipe.slug || '')
            setPrepTime(recipe.prep_time_minutes)
            setServings(recipe.servings)
            setCategoryId(recipe.category_id || '')
            setDifficulty(recipe.difficulty_level as any)
            setCost(recipe.cost_level as any)

            if (recipe.ingredients && recipe.ingredients.length > 0) {
              setIngredients(
                recipe.ingredients
                  .sort((a: any, b: any) => a.sort_order - b.sort_order)
                  .map((i: any) => ({
                    name: i.name,
                    quantity: i.quantity_label || '',
                    unit: i.unit || ''
                  }))
              )
            }
            if (recipe.steps && recipe.steps.length > 0) {
              setSteps(
                recipe.steps
                  .sort((a: any, b: any) => a.step_number - b.step_number)
                  .map((s: any) => s.content)
              )
            }
            if (recipe.tags && recipe.tags.length > 0) {
              setSelectedTags(
                recipe.tags.map((t: any) => t.tag.id)
              )
            }
          }
        } catch (err) {
          toast.error('Erro ao carregar a receita para edição')
          navigate('/app/receitas')
        } finally {
          setIsLoading(false)
        }
      }
      loadRecipe()
    }
  }, [id, navigate])

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
      const fileName = `user-recipes/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('system')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('system')
        .getPublicUrl(fileName)

      setCoverImageUrl(publicUrl)
      toast.success('Imagem enviada com sucesso!')
    } catch (err: any) {
      console.error('Erro ao enviar imagem:', err)
      toast.error(err.message || 'Erro ao enviar imagem')
    } finally {
      setIsUploadingImage(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleAddIngredient = () => {
    setIngredients(prev => [...prev, { name: '', quantity: '', unit: '' }])
  }

  const handleRemoveIngredient = (index: number) => {
    setIngredients(prev => prev.filter((_, i) => i !== index))
  }

  const handleIngredientChange = (index: number, field: 'name' | 'quantity' | 'unit', value: string) => {
    setIngredients(prev => {
      const copy = [...prev]
      copy[index][field] = value
      return copy
    })
  }

  const handleAddStep = () => {
    setSteps(prev => [...prev, ''])
  }

  const handleRemoveStep = (index: number) => {
    setSteps(prev => prev.filter((_, i) => i !== index))
  }

  const handleStepChange = (index: number, value: string) => {
    setSteps(prev => {
      const copy = [...prev]
      copy[index] = value
      return copy
    })
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, hoverIndex: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === hoverIndex) return

    const updatedSteps = [...steps]
    const draggedStep = updatedSteps[draggedIndex]
    
    updatedSteps.splice(draggedIndex, 1)
    updatedSteps.splice(hoverIndex, 0, draggedStep)
    
    setDraggedIndex(hoverIndex)
    setSteps(updatedSteps)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabaseUser) return
    setIsLoading(true)

    try {
      if (!id) {
        const isPremium = user?.subscription_tier && 
                          user.subscription_tier !== 'free' && 
                          user.subscription_tier !== 'plano-gratuito'
        
        if (!isPremium) {
          const { count, error: countError } = await supabase
            .from('recipes')
            .select('*', { count: 'exact', head: true })
            .eq('created_by', supabaseUser.id)
            
          if (countError) throw countError
          
          if (count && count >= 10) {
            toast.error('Limite atingido! O Plano Gratuito permite criar no máximo 10 receitas. Faça upgrade para ter receitas ilimitadas!')
            navigate('/app/assinatura')
            setIsLoading(false)
            return
          }
        }
      }

      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 7)
      
      const recipeData = {
        title,
        subtitle,
        notes: notes || null,
        slug,
        cover_image_url: coverImageUrl || null,
        prep_time_minutes: Number(prepTime),
        servings: Number(servings),
        category_id: categoryId || null,
        difficulty_level: difficulty,
        cost_level: cost,
        status: 'published', // Publish immediately to user's private list
        created_by: supabaseUser.id,
      }

      let recipeId = id

      if (id) {
        // Update recipe
        const { error: updateError } = await supabase
          .from('recipes')
          .update(recipeData)
          .eq('id', id)
        
        if (updateError) throw updateError

        // Delete old ingredients and steps
        await supabase.from('recipe_ingredients').delete().eq('recipe_id', id)
        await supabase.from('recipe_steps').delete().eq('recipe_id', id)
      } else {
        // Insert recipe
        const { data: newRecipe, error: insertError } = await supabase
          .from('recipes')
          .insert(recipeData)
          .select()
          .single()

        if (insertError) throw insertError
        recipeId = newRecipe.id
      }

      // Save ingredients
      const ingredientsData = ingredients
        .filter(i => i.name.trim())
        .map((i, index) => ({
          recipe_id: recipeId!,
          name: i.name,
          quantity_label: i.quantity || null,
          unit: i.unit || null,
          normalized_name: i.name.toLowerCase().trim(),
          sort_order: index
        }))

      if (ingredientsData.length > 0) {
        const { error: ingError } = await supabase
          .from('recipe_ingredients')
          .insert(ingredientsData)
        if (ingError) throw ingError
      }

      // Save steps
      const stepsData = steps
        .filter(s => s.trim())
        .map((s, index) => ({
          recipe_id: recipeId!,
          step_number: index + 1,
          content: s
        }))

      if (stepsData.length > 0) {
        const { error: stepError } = await supabase
          .from('recipe_steps')
          .insert(stepsData)
        if (stepError) throw stepError
      }

      // Save tags
      if (recipeId) {
        const { error: tagDeleteError } = await supabase
          .from('recipe_tag_links')
          .delete()
          .eq('recipe_id', recipeId)
        
        if (tagDeleteError) throw tagDeleteError

        if (selectedTags.length > 0) {
          const tagLinksData = selectedTags.map(tagId => ({
            recipe_id: recipeId!,
            tag_id: tagId
          }))
          const { error: tagInsertError } = await supabase
            .from('recipe_tag_links')
            .insert(tagLinksData)
          
          if (tagInsertError) throw tagInsertError
        }
      }

      toast.success(id ? 'Receita atualizada!' : 'Receita criada!')
      navigate('/app/receitas')
    } catch (err) {
      console.error(err)
      toast.error('Erro ao salvar a receita')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-5 py-8 pb-32">
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="hover:bg-neutral-100 p-2 rounded-full active:scale-95 transition-transform cursor-pointer">
            <ArrowLeft className="h-5 w-5 text-neutral-500" />
          </button>
          <h2 className="text-2xl font-black text-neutral-900">{id ? 'Editar Minha Receita' : 'Nova Receita'}</h2>
        </div>
        {id && recipeSlug && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => window.open(`/app/receitas/${recipeSlug}`, '_blank')}
            className="rounded-full text-xs font-bold flex items-center gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <ExternalLink className="h-3.5 w-3.5 text-primary" />
            Visualizar no Site
          </Button>
        )}
      </header>

      <form onSubmit={handleSave} className="space-y-6">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
          disabled={isUploadingImage}
        />

        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm">
          <div className="space-y-1">
            <Label className="text-sm font-medium">Foto da Receita</Label>
            <div 
              onClick={() => !isUploadingImage && fileInputRef.current?.click()}
              className={cn(
                "relative group aspect-video rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 hover:border-primary/50 transition-all flex flex-col items-center justify-center text-slate-400 gap-2 overflow-hidden cursor-pointer",
                isUploadingImage && "pointer-events-none opacity-80"
              )}
            >
              {isUploadingImage ? (
                <div className="flex flex-col items-center gap-2 text-primary">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="text-xs font-semibold">Enviando foto...</span>
                </div>
              ) : coverImageUrl ? (
                <>
                  <img src={coverImageUrl} alt="Foto da receita" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        fileInputRef.current?.click()
                      }}
                      className="rounded-xl text-xs flex items-center gap-1 bg-white/90 hover:bg-white text-slate-800"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Trocar Foto
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setCoverImageUrl('')
                      }}
                      className="rounded-xl text-xs flex items-center gap-1"
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
                      Clique para fazer upload da foto
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">PNG, JPG, WEBP até 5MB</p>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="title">Nome da Receita</Label>
            <Input id="title" value={title} onChange={e => setTitle(e.target.value)} required placeholder="Ex: Panqueca de Aveia e Banana" />
          </div>

          <div className="space-y-1">
            <Label htmlFor="subtitle">Subtítulo / Descrição Rápida</Label>
            <Input id="subtitle" value={subtitle} onChange={e => setSubtitle(e.target.value)} placeholder="Ex: Café da manhã saudável e prático" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="prepTime">Tempo de Preparo (min)</Label>
              <Input id="prepTime" type="number" value={prepTime} onChange={e => setPrepTime(Number(e.target.value))} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="servings">Porções</Label>
              <Input id="servings" type="number" value={servings} onChange={e => setServings(Number(e.target.value))} required />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label htmlFor="category">Categoria</Label>
              <select 
                id="category" 
                value={categoryId} 
                onChange={e => setCategoryId(e.target.value)}
                className="w-full rounded-xl border p-2.5 text-sm border-slate-200 outline-none"
              >
                <option value="">Selecione...</option>
                {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="difficulty">Dificuldade</Label>
              <select id="difficulty" value={difficulty} onChange={e => setDifficulty(e.target.value as any)} className="w-full rounded-xl border p-2.5 text-sm border-slate-200 outline-none">
                <option value="easy">Fácil</option>
                <option value="medium">Médio</option>
                <option value="hard">Difícil</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="cost">Custo</Label>
              <select id="cost" value={cost} onChange={e => setCost(e.target.value as any)} className="w-full rounded-xl border p-2.5 text-sm border-slate-200 outline-none">
                <option value="low">Baixo</option>
                <option value="medium">Médio</option>
                <option value="high">Alto</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tags Block */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Tags da Receita</h3>
            <p className="text-xs text-slate-500 mt-1">
              Selecione uma ou mais tags para ajudar na classificação e busca da sua receita.
            </p>
          </div>

          {isLoadingTags ? (
            <div className="flex items-center gap-2 text-sm text-slate-400 py-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span>Carregando tags...</span>
            </div>
          ) : !allTags || allTags.length === 0 ? (
            <p className="text-xs text-slate-400 italic">Nenhuma tag ativa encontrada.</p>
          ) : (
            <div className="flex flex-wrap gap-2 pt-1">
              {allTags.map((tag) => {
                const isSelected = selectedTags.includes(tag.id)
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setSelectedTags(prev => prev.filter(id => id !== tag.id))
                      } else {
                        setSelectedTags(prev => [...prev, tag.id])
                      }
                    }}
                    className={cn(
                      "px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer select-none active:scale-95",
                      isSelected
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

        {/* Ingredients Block */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">Ingredientes</h3>
            <Button type="button" variant="outline" size="sm" onClick={handleAddIngredient} className="rounded-full flex items-center gap-1">
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>

          <div className="space-y-3">
            {ingredients.map((ing, idx) => (
              <div key={idx} className="flex gap-3 items-center">
                <div className="flex-1">
                  <Input value={ing.name} onChange={e => handleIngredientChange(idx, 'name', e.target.value)} placeholder="Nome do ingrediente" required />
                </div>
                <div className="w-24">
                  <Input value={ing.quantity} onChange={e => handleIngredientChange(idx, 'quantity', e.target.value)} placeholder="Qtd." />
                </div>
                <div className="w-40">
                  <select
                    value={ing.unit || ''}
                    onChange={e => handleIngredientChange(idx, 'unit', e.target.value)}
                    className="w-full rounded-xl border p-2.5 text-sm border-slate-200 outline-none bg-white cursor-pointer"
                  >
                    <option value="">Sem unidade</option>
                    {INGREDIENT_UNITS.map(unit => (
                      <option key={unit.value} value={unit.value}>
                        {unit.label}
                      </option>
                    ))}
                  </select>
                </div>
                {ingredients.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveIngredient(idx)} className="text-red-500 rounded-full shrink-0">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Steps Block */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">Modo de Preparo (Passos)</h3>
            <Button type="button" variant="outline" size="sm" onClick={handleAddStep} className="rounded-full flex items-center gap-1">
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>

          <div className="space-y-3">
            {steps.map((step, idx) => {
              const isDragged = draggedIndex === idx
              return (
                <div
                  key={idx}
                  draggable
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    "flex gap-3 items-start p-2 rounded-2xl transition-all border border-transparent",
                    isDragged
                      ? "opacity-30 border-dashed border-primary bg-primary/5 scale-[0.98]"
                      : "hover:bg-slate-50/50"
                  )}
                >
                  {/* Drag handle & step number badge */}
                  <div className="flex items-center gap-1 shrink-0 select-none pt-2 text-slate-400 cursor-grab active:cursor-grabbing">
                    <GripVertical className="h-4 w-4 shrink-0" />
                    <span className="font-bold text-sm">#{idx + 1}</span>
                  </div>

                  <div className="flex-1">
                    <textarea 
                      value={step} 
                      onChange={e => handleStepChange(idx, e.target.value)} 
                      placeholder="Instruções deste passo..." 
                      required 
                      className="w-full min-h-[70px] rounded-xl border p-2.5 text-sm border-slate-200 outline-none bg-white"
                    />
                  </div>
                  {steps.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveStep(idx)} className="text-red-500 rounded-full mt-1">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Notes Block */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-3 shadow-sm">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-bold text-slate-900">Notas & Dicas da Receita</h3>
          </div>
          <p className="text-xs text-slate-500">
            Adicione segredos do chefe, sugestões de substituição de ingredientes ou dicas de conservação.
          </p>
          <RichTextEditor
            value={notes}
            onChange={setNotes}
            placeholder="Escreva aqui dicas ou observações sobre esta receita..."
            minHeight="120px"
          />
        </div>

        <Button type="submit" disabled={isLoading} className="w-full py-6 rounded-2xl text-lg font-bold flex items-center gap-2">
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
          Salvar Receita
        </Button>
      </form>
    </div>
  )
}
