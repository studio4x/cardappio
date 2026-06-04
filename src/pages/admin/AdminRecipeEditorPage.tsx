import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Plus, Trash2, Image as ImageIcon, Sparkles, Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingState } from '@/components/shared/LoadingState'
import { useRecipe, useRecipeCategories } from '@/hooks/recipes/useRecipes'
import { Button } from '@/components/ui/button'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useQueryClient } from '@tanstack/react-query'
import { useGenerateNutrition } from '@/hooks/admin/useAIConfig'
import { StepEditor } from '@/components/shared/StepEditor'

/**
 * AdminRecipeEditorPage
 * 
 * Create/Edit form for Recipes.
 */
export function AdminRecipeEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = !id || id === 'nova'
  
  // Note: useRecipe hook currently uses slug. Admin usually uses UUID.
  // I'll assume for admin we fetch by ID. 
  // For simplicity here, I'll fetch using raw supabase if it's an ID.
  const queryClient = useQueryClient()
  const generateNutrition = useGenerateNutrition()
  const [loading, setLoading] = useState(!isNew)
  const [recipeData, setRecipeData] = useState<any>({
    title: '',
    subtitle: '',
    difficulty_level: 'easy',
    cost_level: 'medium',
    prep_time_minutes: 30,
    servings: 2,
    status: 'draft',
    category_id: '',
    calories_per_serving: null,
    protein_per_serving: null,
    fat_per_serving: null,
    carbs_per_serving: null,
    ingredients: [],
    steps: []
  })

  const [allCollections, setAllCollections] = useState<any[]>([])
  const [selectedCollections, setSelectedCollections] = useState<string[]>([])

  const { data: categories } = useRecipeCategories()

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
        const { data } = await supabase
          .from('recipes')
          .select('*, ingredients:recipe_ingredients(*), steps:recipe_steps(*)')
          .eq('id', id)
          .single()
        
        if (data) setRecipeData(data)

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
        <button onClick={() => navigate('/admin/receitas')} className="flex items-center gap-2 text-sm font-semibold text-primary hover:opacity-80">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>
        <Button onClick={handleSave} className="gap-2 px-8">
          <Save className="h-4 w-4" />
          Salvar Receita
        </Button>
      </div>

      <PageHeader title={isNew ? "Nova Receita" : "Editar Receita"} />

      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6 rounded-2xl border bg-white p-6 shadow-sm">
          <h3 className="font-bold border-b pb-2 mb-4">Informações Básicas</h3>
          
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
        </div>

        {/* Media & Status */}
        <div className="space-y-6 rounded-2xl border bg-white p-6 shadow-sm">
          <h3 className="font-bold border-b pb-2 mb-4">Status & Mídia</h3>
          
          <div className="aspect-video rounded-xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 gap-2 overflow-hidden">
             {recipeData.cover_image_url ? (
               <img src={recipeData.cover_image_url} className="h-full w-full object-cover" />
             ) : (
               <>
                 <ImageIcon className="h-8 w-8" />
                 <span className="text-xs">Clique para fazer upload</span>
               </>
             )}
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
            <div key={index} className="flex gap-3 items-start">
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
                  <option value="g">Gramas (g)</option>
                  <option value="kg">Quilogramas (kg)</option>
                  <option value="ml">Mililitros (ml)</option>
                  <option value="l">Litros (l)</option>
                  <option value="unidade">Unidade(s)</option>
                  <option value="colher de sopa">Colher(es) de sopa</option>
                  <option value="colher de chá">Colher(es) de chá</option>
                  <option value="colher de sobremesa">Colher(es) de sobremesa</option>
                  <option value="colher de café">Colher(es) de café</option>
                  <option value="xícara">Xícara(s)</option>
                  <option value="xícara de chá">Xícara(s) de chá</option>
                  <option value="dente">Dente(s)</option>
                  <option value="fatia">Fatia(s)</option>
                  <option value="copo">Copo(s)</option>
                  <option value="pitada">Pitada(s)</option>
                  <option value="lata">Lata(s)</option>
                  <option value="caixa">Caixa(s)</option>
                  <option value="pacote">Pacote(s)</option>
                  <option value="vidro">Vidro(s)</option>
                  <option value="maço">Maço(s)</option>
                  <option value="pedaço">Pedaço(s)</option>
                  <option value="folha">Folha(s)</option>
                  <option value="ramo">Ramo(s)</option>
                  <option value="a gosto">A gosto</option>
                </select>
              </div>
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
            <h3 className="font-bold">Tabela Nutricional</h3>
            <p className="text-xs text-slate-400 mt-0.5">Por porção. Preencha manualmente ou gere automaticamente com IA.</p>
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
                  calories_per_serving: result.calories,
                  protein_per_serving: result.protein,
                  fat_per_serving: result.fat,
                  carbs_per_serving: result.carbs
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

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {([
            { label: 'Calorias (kcal)', field: 'calories_per_serving', placeholder: 'Ex: 342' },
            { label: 'Proteínas (g)', field: 'protein_per_serving', placeholder: 'Ex: 28' },
            { label: 'Gorduras (g)', field: 'fat_per_serving', placeholder: 'Ex: 18' },
            { label: 'Carboidratos (g)', field: 'carbs_per_serving', placeholder: 'Ex: 12' },
          ] as const).map(({ label, field, placeholder }) => (
            <div key={field} className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={recipeData[field] ?? ''}
                onChange={e => setRecipeData((prev: any) => ({
                  ...prev,
                  [field]: e.target.value === '' ? null : parseFloat(e.target.value)
                }))}
                placeholder={placeholder}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-mono outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>
          ))}
        </div>

        {generateNutrition.isPending && (
          <div className="flex items-center gap-2 text-xs text-slate-400 animate-pulse">
            <Sparkles className="h-3 w-3" />
            Analisando ingredientes com IA... isso pode levar alguns segundos.
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
          {recipeData.steps?.sort((a: any, b: any) => a.step_number - b.step_number).map((step: any, index: number) => (
            <div key={index} className="flex gap-4 items-start">
              {/* Step number badge */}
              <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 mt-2">
                {index + 1}
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
          ))}
          {(!recipeData.steps || recipeData.steps.length === 0) && (
            <p className="text-center py-4 text-slate-400 text-sm italic">Nenhum passo adicionado.</p>
          )}
        </div>
      </div>

      {/* ── Bottom Save Bar ─────────────────────────────────────── */}
      <div className="flex items-center justify-between rounded-2xl border bg-white p-4 shadow-sm">
        <p className="text-sm text-slate-400">
          Revise os campos acima antes de salvar.
        </p>
        <Button onClick={handleSave} className="gap-2 px-8">
          <Save className="h-4 w-4" />
          Salvar Receita
        </Button>
      </div>
    </div>
  )
}
