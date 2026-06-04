import { useState, useEffect } from 'react'
import { useAdminCollections } from '@/hooks/admin/useAdminEditorial'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingState } from '@/components/shared/LoadingState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Plus, 
  Trash2, 
  Edit2, 
  LayoutGrid, 
  Star, 
  X, 
  Search, 
  Loader2,
  Image as ImageIcon
} from 'lucide-react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export function AdminCollectionsPage() {
  const { data: collections, isLoading, saveMutation, deleteMutation } = useAdminCollections()

  // Modal / Form States
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState<any>({
    title: '',
    slug: '',
    description: '',
    cover_image_url: '',
    is_active: true,
    is_premium: false,
    sort_order: 1
  })
  const [selectedRecipes, setSelectedRecipes] = useState<any[]>([])
  
  // Search recipe States
  const [recipeSearch, setRecipeSearch] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)

  // Debounced search for recipes
  useEffect(() => {
    if (recipeSearch.trim().length < 2) {
      setSearchResults([])
      return
    }
    const delayDebounce = setTimeout(async () => {
      setSearching(true)
      const { data } = await supabase
        .from('recipes')
        .select('id, title, cover_image_url')
        .ilike('title', `%${recipeSearch}%`)
        .limit(10)
      if (data) setSearchResults(data)
      setSearching(false)
    }, 300)
    return () => clearTimeout(delayDebounce)
  }, [recipeSearch])

  if (isLoading) return <LoadingState />

  const handleTitleChange = (title: string) => {
    const slug = title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "") // remove special chars
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-') // collapse multiple dashes

    setFormData((prev: any) => ({
      ...prev,
      title,
      slug: prev.id ? prev.slug : slug
    }))
  }

  const handleNewClick = () => {
    setFormData({
      title: '',
      slug: '',
      description: '',
      cover_image_url: '',
      is_active: true,
      is_premium: false,
      sort_order: (collections?.length || 0) + 1
    })
    setSelectedRecipes([])
    setIsOpen(true)
  }

  const handleEditClick = async (coll: any) => {
    setFormData({
      id: coll.id,
      title: coll.title || '',
      slug: coll.slug || '',
      description: coll.description || '',
      cover_image_url: coll.cover_image_url || '',
      is_active: coll.is_active ?? true,
      is_premium: coll.is_premium ?? false,
      sort_order: coll.sort_order ?? 1
    })
    
    // Fetch recipes associated with this collection
    const { data } = await supabase
      .from('recipe_collection_items')
      .select('recipe:recipes(id, title, cover_image_url)')
      .eq('collection_id', coll.id)
      .order('sort_order')
    
    if (data) {
      setSelectedRecipes(data.map((item: any) => item.recipe).filter(Boolean))
    } else {
      setSelectedRecipes([])
    }
    setIsOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Excluir esta coleção? (As receitas não serão deletadas, apenas o agrupamento)')) {
      deleteMutation.mutate(id)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title) {
      toast.error('Título é obrigatório')
      return
    }

    saveMutation.mutate({
      ...formData,
      recipes: selectedRecipes.map(r => r.id)
    }, {
      onSuccess: () => {
        setIsOpen(false)
      }
    })
  }

  return (
    <div className="space-y-8 pb-20">
      <PageHeader 
        title="Coleções Editoriais" 
        subtitle="Agrupe receitas em temas para inspirar os usuários (Especial de Páscoa, Marmitas, etc)."
        actions={
          <Button onClick={handleNewClick} className="rounded-full px-6 bg-slate-900">
            <Plus className="h-4 w-4 mr-2" />
            Nova Coleção
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {collections?.map((coll) => (
          <div 
            key={coll.id} 
            className="flex flex-col rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="relative aspect-[21/9] bg-slate-100 flex items-center justify-center">
              {coll.cover_image_url ? (
                <img src={coll.cover_image_url} className="h-full w-full object-cover" />
              ) : (
                <LayoutGrid className="h-8 w-8 text-slate-300" />
              )}
              {coll.is_premium && (
                <div className="absolute top-4 left-4 bg-amber-400 text-amber-950 text-[10px] font-black uppercase px-2 py-1 rounded-full flex items-center gap-1">
                  <Star className="h-2 w-2 fill-current" />
                  Premium
                </div>
              )}
              {!coll.is_active && (
                <div className="absolute top-4 right-4 bg-slate-500 text-white text-[10px] font-black uppercase px-2 py-1 rounded-full">
                  Inativa
                </div>
              )}
            </div>
            <div className="p-6 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900">{coll.title}</h4>
                <p className="text-xs text-slate-400">{coll.slug}</p>
                {coll.description && (
                  <p className="text-xs text-slate-500 mt-1 line-clamp-1">{coll.description}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleEditClick(coll)}
                  className="h-9 w-9 p-0 rounded-full hover:bg-slate-100"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleDelete(coll.id)}
                  className="h-9 w-9 p-0 rounded-full hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Editor Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {formData.id ? 'Editar Coleção' : 'Nova Coleção'}
            </DialogTitle>
            <DialogDescription>
              Preencha os metadados da coleção e gerencie as receitas associadas.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-6 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título da Coleção</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Ex: Especial de Inverno"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug (URL)</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="ex-especial-inverno"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Uma breve descrição sobre o tema desta coleção..."
                rows={3}
                className="w-full rounded-lg border border-slate-200 p-2 text-sm outline-none focus:ring-1 focus:ring-primary bg-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="cover_image_url">URL da Imagem de Capa</Label>
                <Input
                  id="cover_image_url"
                  value={formData.cover_image_url}
                  onChange={(e) => setFormData({ ...formData, cover_image_url: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sort_order">Ordem de Exibição</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            {/* Checkboxes */}
            <div className="flex gap-6 p-3 bg-slate-50 rounded-2xl border">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold uppercase text-slate-600">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4"
                />
                Coleção Ativa
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold uppercase text-slate-600">
                <input
                  type="checkbox"
                  checked={formData.is_premium}
                  onChange={(e) => setFormData({ ...formData, is_premium: e.target.checked })}
                  className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4"
                />
                Premium
              </label>
            </div>

            {/* Recipes Management Section */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h4 className="font-bold text-sm text-slate-900 text-left">Gerenciar Receitas ({selectedRecipes.length})</h4>
              
              {/* Recipe Search input */}
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Buscar receita para adicionar à coleção..."
                  value={recipeSearch}
                  onChange={(e) => setRecipeSearch(e.target.value)}
                  className="pl-10 text-slate-800"
                />
                {searching && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />}
              </div>

              {/* Search Results list */}
              {searchResults.length > 0 && (
                <div className="bg-slate-50 rounded-2xl border p-2 divide-y max-h-40 overflow-y-auto">
                  {searchResults.map((rec) => {
                    const isAlreadyAdded = selectedRecipes.some(r => r.id === rec.id)
                    return (
                      <div key={rec.id} className="flex items-center justify-between py-2 px-3 hover:bg-slate-100 rounded-lg">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded overflow-hidden bg-slate-200 flex-shrink-0">
                            {rec.cover_image_url ? (
                              <img src={rec.cover_image_url} className="h-full w-full object-cover" />
                            ) : (
                              <ImageIcon className="h-4 w-4 text-slate-400 m-2" />
                            )}
                          </div>
                          <span className="text-xs font-semibold text-slate-700">{rec.title}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={isAlreadyAdded}
                          onClick={() => {
                            if (!isAlreadyAdded) {
                              setSelectedRecipes([...selectedRecipes, rec])
                            }
                            setRecipeSearch('')
                            setSearchResults([])
                          }}
                          className="h-7 text-xs px-2.5 font-bold uppercase text-primary rounded-full hover:bg-primary/10"
                        >
                          {isAlreadyAdded ? 'Adicionado' : 'Adicionar'}
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Selected Recipes list */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {selectedRecipes.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2 text-center">Nenhuma receita associada a esta coleção.</p>
                ) : (
                  selectedRecipes.map((rec, index) => (
                    <div key={rec.id} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-100 rounded-xl hover:border-slate-200 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg overflow-hidden bg-slate-200 flex-shrink-0">
                          {rec.cover_image_url ? (
                            <img src={rec.cover_image_url} className="h-full w-full object-cover" />
                          ) : (
                            <ImageIcon className="h-4 w-4 text-slate-400 m-2.5" />
                          )}
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-bold text-slate-800 line-clamp-1">{rec.title}</p>
                          <p className="text-[10px] text-slate-400">Ordem: {index + 1}</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedRecipes(selectedRecipes.filter(r => r.id !== rec.id))}
                        className="h-8 w-8 text-slate-400 hover:text-red-500 rounded-full"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 border-t pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="rounded-full px-6"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saveMutation.isPending}
                className="rounded-full px-6"
              >
                {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
