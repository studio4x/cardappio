import { useState } from 'react'
import { Plus, Search, Filter, MoreVertical, Edit2, Trash2, ExternalLink } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingState } from '@/components/shared/LoadingState'
import { useRecipes } from '@/hooks/recipes/useRecipes'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

/**
 * AdminRecipesPage
 * 
 * Listing and management of all recipes.
 */
export function AdminRecipesPage() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const { data: recipes, isLoading } = useRecipes({ search: searchTerm })

  if (isLoading) return <LoadingState message="Carregando receitas..." />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Receitas" subtitle="Gerencie o catálogo de pratos da plataforma." />
        <Button onClick={() => navigate('/admin/receitas/nova')} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Receita
        </Button>
      </div>

      {/* Filters & search */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por título..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border p-2.5 pl-10 focus:outline-none focus:ring-2 focus:ring-primary"
            style={{ borderColor: 'var(--color-outline-variant)' }}
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filtros
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border bg-white" style={{ borderColor: 'var(--color-outline-variant)' }}>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b" style={{ borderColor: 'var(--color-outline-variant)', color: 'var(--color-outline)' }}>
            <tr>
              <th className="px-6 py-4 font-bold uppercase tracking-wider">Título</th>
              <th className="px-6 py-4 font-bold uppercase tracking-wider">Categoria</th>
              <th className="px-6 py-4 font-bold uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 font-bold uppercase tracking-wider text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: 'var(--color-outline-variant)' }}>
            {!recipes || recipes.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground italic">
                  Nenhuma receita encontrada.
                </td>
              </tr>
            ) : (
              recipes.map((recipe) => (
                <tr key={recipe.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-slate-100 overflow-hidden">
                        {recipe.cover_image_url && (
                          <img src={recipe.cover_image_url} alt="" className="h-full w-full object-cover" />
                        )}
                      </div>
                      <span className="font-semibold text-foreground">{recipe.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="outline">{recipe.category?.name || 'Sem categoria'}</Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={cn(
                      recipe.status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    )}>
                      {recipe.status === 'published' ? 'Publicado' : 'Rascunho'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => navigate(`/admin/receitas/${recipe.id}`)}
                        title="Editar"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => window.open(`/app/receitas/${recipe.slug}`, '_blank')}
                        title="Ver no app"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
