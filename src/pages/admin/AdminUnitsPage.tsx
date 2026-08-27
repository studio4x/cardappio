import { useState } from 'react'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingState } from '@/components/shared/LoadingState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  useAdminMeasurementUnits,
  type MeasurementUnit,
  type MeasurementUnitInput
} from '@/hooks/admin/useAdminMeasurementUnits'
import { Plus, Edit2, Trash2, Search, Scale, CheckCircle2, XCircle, ArrowUpDown, Filter, RotateCw, AlertTriangle, Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const CATEGORY_OPTIONS = [
  'Geral',
  'Colheres',
  'Xícaras e Copos',
  'Peso',
  'Volume',
  'Unidade',
  'Recipiente',
  'Medida',
  'Outro'
]

const SQL_MIGRATION_SCRIPT = `-- Migration 045: Create measurement_units table
CREATE TABLE IF NOT EXISTS public.measurement_units (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  symbol      TEXT NOT NULL UNIQUE,
  category    TEXT DEFAULT 'Geral',
  sort_order  INT NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.measurement_units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "measurement_units_select_policy"
  ON public.measurement_units FOR SELECT USING (true);

CREATE POLICY "measurement_units_admin_all_policy"
  ON public.measurement_units FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')));`

export function AdminUnitsPage() {
  const {
    units,
    isLoading,
    isTableMissing,
    saveMutation,
    deleteMutation,
    toggleActiveMutation,
    seedDefaultsMutation
  } = useAdminMeasurementUnits()

  const [copiedSql, setCopiedSql] = useState(false)

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  
  // Dialog States
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingUnit, setEditingUnit] = useState<MeasurementUnit | null>(null)
  
  // Form State
  const [formData, setFormData] = useState<MeasurementUnitInput>({
    name: '',
    symbol: '',
    category: 'Geral',
    sort_order: 0,
    is_active: true
  })

  // Delete Dialog State
  const [deleteUnitId, setDeleteUnitId] = useState<string | null>(null)

  if (isLoading) return <LoadingState />

  const filteredUnits = units
    .filter(unit => {
      const matchesSearch = 
        unit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        unit.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (unit.category && unit.category.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesCategory = 
        selectedCategory === 'ALL' || 
        (unit.category || 'Geral').toLowerCase() === selectedCategory.toLowerCase()

      return matchesSearch && matchesCategory
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))

  const totalCount = units.length
  const activeCount = units.filter(u => u.is_active).length
  const inactiveCount = totalCount - activeCount

  const handleOpenCreate = () => {
    setEditingUnit(null)
    setFormData({
      name: '',
      symbol: '',
      category: 'Geral',
      sort_order: (units.length || 0) + 1,
      is_active: true
    })
    setIsFormOpen(true)
  }

  const handleOpenEdit = (unit: MeasurementUnit) => {
    setEditingUnit(unit)
    setFormData({
      id: unit.id,
      name: unit.name,
      symbol: unit.symbol,
      category: unit.category || 'Geral',
      sort_order: unit.sort_order,
      is_active: unit.is_active
    })
    setIsFormOpen(true)
  }

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.symbol.trim()) return

    saveMutation.mutate(formData, {
      onSuccess: () => {
        setIsFormOpen(false)
      }
    })
  }

  const handleDeleteConfirm = () => {
    if (!deleteUnitId) return
    deleteMutation.mutate(deleteUnitId, {
      onSuccess: () => {
        setDeleteUnitId(null)
      }
    })
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <PageHeader
        title="Unidades de Medida"
        subtitle="Cadastre, edite e organize as unidades de medida para ingredientes das receitas."
        actions={
          <Button 
            onClick={handleOpenCreate} 
            className="rounded-full px-6 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Unidade
          </Button>
        }
      />

      {/* Table Missing Warning Banner */}
      {isTableMissing && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 shadow-sm flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex gap-3">
            <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-amber-900 text-sm">Tabela 'measurement_units' pendente no Supabase</h4>
              <p className="text-xs text-amber-700 mt-1 max-w-2xl leading-relaxed">
                A tabela de unidades ainda não foi criada no banco de dados do seu projeto Supabase (Erro 404). 
                As 63 unidades estão ativas em exibição local. Para cadastrar novas unidades e salvá-las no banco, basta executar o script SQL no <strong>SQL Editor</strong> do Supabase.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(SQL_MIGRATION_SCRIPT)
              setCopiedSql(true)
              toast.success('Script SQL copiado com sucesso!')
              setTimeout(() => setCopiedSql(false), 3000)
            }}
            className="rounded-full px-5 bg-amber-600 hover:bg-amber-700 text-white shrink-0 font-medium text-xs shadow-sm"
          >
            {copiedSql ? <Check className="h-3.5 w-3.5 mr-1.5" /> : <Copy className="h-3.5 w-3.5 mr-1.5" />}
            {copiedSql ? 'SQL Copiado!' : 'Copiar SQL da Migration'}
          </Button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total de Unidades</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{totalCount}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
            <Scale className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Unidades Ativas</p>
            <p className="text-2xl font-bold text-emerald-700 mt-1">{activeCount}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Inativas</p>
            <p className="text-2xl font-bold text-slate-600 mt-1">{inactiveCount}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
            <XCircle className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex-1 w-full flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
          <Search className="h-4 w-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Buscar por nome, sigla ou categoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none focus:outline-none text-sm text-slate-800 placeholder-slate-400 w-full"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <Filter className="h-4 w-4 text-slate-400 shrink-0 hidden md:block" />
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0",
              selectedCategory === 'ALL'
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            Todas
          </button>
          {CATEGORY_OPTIONS.slice(0, 5).map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0",
                selectedCategory.toLowerCase() === cat.toLowerCase()
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Units Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-4 px-6">Unidade de Medida</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredUnits.map((unit) => (
                <tr 
                  key={unit.id} 
                  className={cn(
                    "hover:bg-slate-50/80 transition-colors",
                    !unit.is_active && "opacity-60 bg-slate-50/40"
                  )}
                >
                  <td className="py-4 px-6">
                    <div className="flex items-start gap-3">
                      <span className="h-8 w-8 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center shrink-0 uppercase font-mono mt-0.5">
                        {unit.name.charAt(0)}
                      </span>
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-900 block">{unit.name}</span>
                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                          <code className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                            {unit.symbol}
                          </code>
                          <span className="text-slate-350 select-none text-[10px]">•</span>
                          <span className="bg-slate-50 text-slate-500 px-1.5 py-0.5 rounded text-[10px] font-semibold border border-slate-100">
                            {unit.category || 'Geral'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="py-4 px-6 vertical-align-middle">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={unit.is_active}
                        onCheckedChange={(checked) => 
                          toggleActiveMutation.mutate({ id: unit.id, is_active: checked, unit })
                        }
                      />
                      <span className={cn(
                        "text-xs font-semibold",
                        unit.is_active ? "text-emerald-600" : "text-slate-400"
                      )}>
                        {unit.is_active ? 'Ativa' : 'Inativa'}
                      </span>
                    </div>
                  </td>

                  <td className="py-4 px-6 text-right vertical-align-middle">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(unit)}
                        className="h-8 w-8 p-0 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-900"
                        title="Editar Unidade"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteUnitId(unit.id)}
                        className="h-8 w-8 p-0 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-600"
                        title="Excluir Unidade"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredUnits.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 italic">
                    {searchTerm || selectedCategory !== 'ALL'
                      ? 'Nenhuma unidade de medida encontrada para os filtros selecionados.'
                      : 'Nenhuma unidade de medida cadastrada.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal (Create / Edit) */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-md bg-white rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">
              {editingUnit ? 'Editar Unidade de Medida' : 'Nova Unidade de Medida'}
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-sm">
              Preencha os detalhes da unidade usada na dosagem de ingredientes.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitForm} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="unit-name" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Nome / Rótulo da Unidade *
              </Label>
              <Input
                id="unit-name"
                placeholder="Ex: Colher(es) de sopa, Gramas (g), Xícara(s)"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
                className="rounded-xl border-slate-200"
              />
              <p className="text-[11px] text-slate-400">Nome exibido nas opções do formulário.</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="unit-symbol" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Sigla / Símbolo / Valor *
              </Label>
              <Input
                id="unit-symbol"
                placeholder="Ex: colher (sopa), g, ml, xícara"
                value={formData.symbol}
                onChange={(e) => setFormData(prev => ({ ...prev, symbol: e.target.value }))}
                required
                className="rounded-xl border-slate-200 font-mono text-sm"
              />
              <p className="text-[11px] text-slate-400">Identificador interno da unidade salvo na receita.</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="unit-category" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Categoria
              </Label>
              <select
                id="unit-category"
                value={formData.category || 'Geral'}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                {CATEGORY_OPTIONS.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 mt-2">
              <div>
                <p className="text-xs font-bold text-slate-800">Unidade Ativa</p>
                <p className="text-[11px] text-slate-500">Disponível para seleção ao criar/editar receitas</p>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
            </div>

            <DialogFooter className="mt-6 pt-2 border-t border-slate-100 flex gap-2 justify-end">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsFormOpen(false)}
                className="rounded-full px-5"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={saveMutation.isPending}
                className="rounded-full px-6 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {saveMutation.isPending ? 'Salvando...' : 'Salvar Unidade'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deleteUnitId} onOpenChange={() => setDeleteUnitId(null)}>
        <DialogContent className="sm:max-w-md bg-white rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">Excluir Unidade de Medida?</DialogTitle>
            <DialogDescription className="text-slate-500 text-sm mt-2">
              Esta ação removerá a unidade do cadastro geral. As receitas que já utilizam essa unidade no banco continuarão exibindo o texto normalmente, porém ela não estará mais disponível para novos cadastros.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-6 flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setDeleteUnitId(null)}
              className="rounded-full px-5"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
              className="rounded-full px-6 bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteMutation.isPending ? 'Excluindo...' : 'Sim, Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
