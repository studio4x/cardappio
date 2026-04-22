import { useAdminCollections } from '@/hooks/admin/useAdminEditorial'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingState } from '@/components/shared/LoadingState'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, Edit2, LayoutGrid, Star } from 'lucide-react'

export function AdminCollectionsPage() {
  const { data: collections, isLoading, saveMutation, deleteMutation } = useAdminCollections()

  if (isLoading) return <LoadingState />

  const handleAdd = () => {
    const title = prompt('Título da Coleção:')
    if (title) {
      const slug = title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-')
      saveMutation.mutate({ 
        title, 
        slug, 
        is_active: true,
        sort_order: (collections?.length || 0) + 1 
      })
    }
  }

  const handleDelete = (id: string) => {
    if (confirm('Excluir esta coleção? (As receitas não serão deletadas, apenas o agrupamento)')) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Coleções Editoriais" 
        subtitle="Agrupe receitas em temas para inspirar os usuários (Especial de Páscoa, Marmitas, etc)."
        actions={
          <Button onClick={handleAdd} className="rounded-full px-6 bg-slate-900">
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
            </div>
            <div className="p-6 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900">{coll.title}</h4>
                <p className="text-xs text-slate-400">{coll.slug}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-full hover:bg-slate-100">
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
    </div>
  )
}
