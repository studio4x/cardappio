import { useAdminCategories } from '@/hooks/admin/useAdminTaxonomy'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingState } from '@/components/shared/LoadingState'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, Edit2, GripVertical } from 'lucide-react'
import { useState } from 'react'

export function AdminCategoriesPage() {
  const { data: categories, isLoading, saveMutation, deleteMutation } = useAdminCategories()
  const [editingId, setEditingId] = useState<string | null>(null)

  if (isLoading) return <LoadingState />

  const handleAdd = () => {
    const name = prompt('Nome da nova categoria:')
    if (name) {
      const slug = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-')
      saveMutation.mutate({ name, slug, sort_order: (categories?.length || 0) + 1 })
    }
  }

  const handleEdit = (cat: any) => {
    const newName = prompt('Novo nome:', cat.name)
    if (newName) {
      saveMutation.mutate({ ...cat, name: newName })
    }
  }

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta categoria?')) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Categorias de Receitas" 
        subtitle="Gerencie as categorias principais para organização do catálogo."
        actions={
          <Button onClick={handleAdd} className="rounded-full px-6 bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4 mr-2" />
            Nova Categoria
          </Button>
        }
      />

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <ul className="divide-y divide-slate-100">
          {categories?.map((cat) => (
            <li key={cat.id} className="flex items-center gap-4 p-5 hover:bg-slate-50 transition-colors">
              <GripVertical className="h-5 w-5 text-slate-300 cursor-grab" />
              <div className="flex-1">
                <h4 className="font-bold text-slate-900">{cat.name}</h4>
                <p className="text-xs text-slate-400 font-mono">{cat.slug}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => handleEdit(cat)} className="h-9 w-9 p-0 rounded-full">
                  <Edit2 className="h-4 w-4 text-slate-400" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(cat.id)} className="h-9 w-9 p-0 rounded-full hover:bg-red-50 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
          {categories?.length === 0 && (
            <li className="p-12 text-center text-slate-400 italic">
              Nenhuma categoria cadastrada.
            </li>
          )}
        </ul>
      </div>
    </div>
  )
}
