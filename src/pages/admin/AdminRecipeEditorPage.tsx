import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Plus, Trash2, Image as ImageIcon } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingState } from '@/components/shared/LoadingState'
import { useRecipe, useRecipeCategories } from '@/hooks/recipes/useRecipes'
import { Button } from '@/components/ui/button'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

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
  const [loading, setLoading] = useState(!isNew)
  const [recipeData, setRecipeData] = useState<any>({
    title: '',
    subtitle: '',
    difficulty_level: 'easy',
    prep_time_minutes: 30,
    servings: 2,
    status: 'draft',
    category_id: '',
    ingredients: [],
    steps: []
  })

  const { data: categories } = useRecipeCategories()

  useEffect(() => {
    if (!isNew) {
      const fetchRecipe = async () => {
        const { data, error } = await supabase
          .from('recipes')
          .select('*, ingredients:recipe_ingredients(*), steps:recipe_steps(*)')
          .eq('id', id)
          .single()
        
        if (data) setRecipeData(data)
        setLoading(false)
      }
      fetchRecipe()
    }
  }, [id, isNew])

  const handleSave = async () => {
    setLoading(true)
    try {
      const { ingredients, steps, ...cleanData } = recipeData
      
      const { data, error } = isNew 
        ? await supabase.from('recipes').insert(cleanData).select().single()
        : await supabase.from('recipes').update(cleanData).eq('id', id).select().single()

      if (error) throw error

      toast.success('Receita salva com sucesso!')
      if (isNew) navigate(`/admin/receitas/${data.id}`)
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
        </div>
      </div>

      {/* Note Placeholder for Ingredients/Steps */}
      <div className="p-12 rounded-2xl border-2 border-dashed border-slate-100 flex items-center justify-center text-slate-400 italic">
        Gestão avançada de ingredientes e etapas em desenvolvimento...
      </div>
    </div>
  )
}
