import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Save, Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { useRecipeCategories } from '@/hooks/recipes/useRecipes'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/app/providers/AuthProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export function UserRecipeEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { supabaseUser, user } = useAuth()
  const { data: categories } = useRecipeCategories()

  const [isLoading, setIsLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
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
            .select('*, ingredients:recipe_ingredients(*), steps:recipe_steps(*)')
            .eq('id', id)
            .single()

          if (recipeError) throw recipeError
          if (recipe) {
            setTitle(recipe.title)
            setSubtitle(recipe.subtitle || '')
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
        slug,
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
      <header className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="hover:bg-neutral-100 p-2 rounded-full active:scale-95 transition-transform">
          <ArrowLeft className="h-5 w-5 text-neutral-500" />
        </button>
        <h2 className="text-2xl font-black text-neutral-900">{id ? 'Editar Minha Receita' : 'Nova Receita'}</h2>
      </header>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm">
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
                    {/* Antigas mantidas */}
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
                    {/* Novas unidades adicionadas */}
                    <option value="quilo">Quilo (quilo)</option>
                    <option value="quilos">Quilos (quilos)</option>
                    <option value="grama">Grama (grama)</option>
                    <option value="gramas">Gramas (gramas)</option>
                    <option value="mg">Miligramas (mg)</option>
                    <option value="milligrama">Miligrama (milligrama)</option>
                    <option value="milligramas">Miligramas (milligramas)</option>
                    <option value="liter">Liter (liter)</option>
                    <option value="litros">Litros (litros)</option>
                    <option value="dl">Decilitros (dl)</option>
                    <option value="decilitro">Decilitro (decilitro)</option>
                    <option value="decilitros">Decilitros (decilitros)</option>
                    <option value="cl">Centilitros (cl)</option>
                    <option value="centilitro">Centilitro (centilitro)</option>
                    <option value="centilitros">Centilitros (centilitros)</option>
                    <option value="millilitro">Mililitro (millilitro)</option>
                    <option value="millilitros">Mililitros (millilitros)</option>
                    <option value="xícaras">Xícaras (xícaras)</option>
                    <option value="colher (sopa)">Colher (sopa)</option>
                    <option value="colheres (sopa)">Colheres (sopa)</option>
                    <option value="colher (chá)">Colher (chá)</option>
                    <option value="colheres (chá)">Colheres (chá)</option>
                    <option value="colher (sobremesa)">Colher (sobremesa)</option>
                    <option value="colheres (sobremesa)">Colheres (sobremesa)</option>
                    <option value="colher (café)">Colher (café)</option>
                    <option value="colheres (café)">Colheres (café)</option>
                    <option value="cm">Centímetro(s) (cm)</option>
                    <option value="centímetro">Centímetro (centímetro)</option>
                    <option value="centímetros">Centímetros (centímetros)</option>
                    <option value="mm">Milímetro(s) (mm)</option>
                    <option value="milímetro">Milímetro (milímetro)</option>
                    <option value="milímetros">Milímetros (milímetros)</option>
                    <option value="dentes">Dentes (dentes)</option>
                    <option value="molho">Molho (molho)</option>
                    <option value="molhos">Molhos (molhos)</option>
                    <option value="folhas">Folhas (folhas)</option>
                    <option value="fatias">Fatias (fatias)</option>
                    <option value="pedaços">Pedaços (pedaços)</option>
                    <option value="porção">Porção (porção)</option>
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
            {steps.map((step, idx) => (
              <div key={idx} className="flex gap-3 items-start">
                <span className="font-bold text-slate-400 pt-2 text-sm">#{idx + 1}</span>
                <div className="flex-1">
                  <textarea 
                    value={step} 
                    onChange={e => handleStepChange(idx, e.target.value)} 
                    placeholder="Instruções deste passo..." 
                    required 
                    className="w-full min-h-[70px] rounded-xl border p-2.5 text-sm border-slate-200 outline-none"
                  />
                </div>
                {steps.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveStep(idx)} className="text-red-500 rounded-full mt-1">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        <Button type="submit" disabled={isLoading} className="w-full py-6 rounded-2xl text-lg font-bold flex items-center gap-2">
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
          Salvar Receita
        </Button>
      </form>
    </div>
  )
}
