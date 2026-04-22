import { useAdminTags } from '@/hooks/admin/useAdminTaxonomy'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingState } from '@/components/shared/LoadingState'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, Tag as TagIcon, Search } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export function AdminTagsPage() {
  const { data: tags, isLoading, saveMutation, deleteMutation } = useAdminTags()
  const [searchTerm, setSearchTerm] = useState('')

  if (isLoading) return <LoadingState />

  const filteredTags = tags?.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.tag_type?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAdd = () => {
    const name = prompt('Nome da nova tag (ex: Vegano, Low Carb):')
    if (name) {
      const type = prompt('Tipo da tag (ex: diet, difficulty, budget):', 'diet')
      const slug = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-')
      saveMutation.mutate({ name, slug, tag_type: type })
    }
  }

  const handleDelete = (id: string) => {
    if (confirm('Excluir esta tag?')) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Gerenciamento de Tags" 
        subtitle="Tags para filtros de dietas, restrições e atributos contextuais."
        actions={
          <Button onClick={handleAdd} className="rounded-full px-6 bg-indigo-600 hover:bg-indigo-700">
            <Plus className="h-4 w-4 mr-2" />
            Nova Tag
          </Button>
        }
      />

      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm transition-focus-within focus-within:ring-2 focus-within:ring-indigo-500/20">
        <Search className="h-5 w-5 text-slate-400 ml-2" />
        <input 
          type="text" 
          placeholder="Buscar por nome ou tipo..."
          className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTags?.map((tag) => (
          <div 
            key={tag.id} 
            className="group flex items-center justify-between p-5 bg-white border border-slate-200 rounded-2xl hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                <TagIcon className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">{tag.name}</h4>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{tag.tag_type || 'untyped'}</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => handleDelete(tag.id)} 
              className="h-8 w-8 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
