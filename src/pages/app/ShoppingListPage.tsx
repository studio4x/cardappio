import { ShoppingCart, RefreshCw, Loader2, Package, Share2, Search, Utensils, Plus, Apple, Leaf, Milk, Beef, SlidersVertical as TuneIcon, Printer, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { EmptyState } from '@/components/shared/EmptyState'
import { useShoppingList, useGenerateShoppingList, useToggleShoppingItem, useShareResource, useDeleteShoppingItem, useDeleteShoppingList, useAddShoppingItem } from '@/hooks/shopping/useShopping'
import { useActiveWeek, useWeeks } from '@/hooks/planning/usePlanning'
import { ShoppingChecklistItem } from '@/components/shopping/ShoppingChecklistItem'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useParams, useNavigate } from 'react-router-dom'
import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'

export function ShoppingListPage() {
  const { weekId: routeWeekId } = useParams()
  const navigate = useNavigate()
  const { data: activeWeek } = useActiveWeek()
  const { data: weeks } = useWeeks()
  const [searchTerm, setSearchTerm] = useState('')

  const weekId = routeWeekId ?? activeWeek?.id
  const selectedWeek = weeks?.find(w => w.id === weekId)

  const { data: shoppingList, isLoading, error, refetch } = useShoppingList(weekId)
  const generateList = useGenerateShoppingList()
  const toggleItem = useToggleShoppingItem()
  const shareResource = useShareResource()
  const deleteItem = useDeleteShoppingItem()
  const deleteList = useDeleteShoppingList()
  const addCustomItem = useAddShoppingItem()

  const [isAddingCustom, setIsAddingCustom] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customQty, setCustomQty] = useState('')


  const items = useMemo(() => {
    if (!shoppingList?.items) return []
    return [...shoppingList.items].filter(item => 
      item.ingredient_label.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => {
      if (a.is_checked !== b.is_checked) return a.is_checked ? 1 : -1
      return a.sort_order - b.sort_order
    })
  }, [shoppingList, searchTerm])

  const groupedItems = useMemo(() => {
    const groups: Record<string, typeof items> = {}
    items.forEach(item => {
      // Cast to any for the temporary 'category' until types are updated or use a fallback
      const cat = (item as any).category || 'Outros'
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(item)
    })
    return groups
  }, [items])

  const handleShare = async () => {
    if (!shoppingList) return
    try {
      const data = await shareResource.mutateAsync({
        resourceType: 'list',
        resourceId: shoppingList.id
      })
      const fullUrl = `${window.location.origin}/compartilhar/${data.token}`
      await navigator.clipboard.writeText(fullUrl)
      toast.success('Link de compartilhamento copiado!')
    } catch (err) {
      toast.error('Erro ao compartilhar')
    }
  }

  const handleGenerate = async () => {
    if (!weekId) return
    try {
      await generateList.mutateAsync(weekId)
      toast.success('Lista de compras gerada com sucesso!')
    } catch (err: any) {
      toast.error('Erro ao gerar lista de compras: ' + (err.message || 'Erro desconhecido'))
    }
  }

  const handleToggle = async (itemId: string, currentState: boolean) => {
    try {
      await toggleItem.mutateAsync({ itemId, isChecked: !currentState })
    } catch (err) {}
  }

  const handleDeleteItem = async (itemId: string) => {
    try {
      await deleteItem.mutateAsync(itemId)
      toast.success('Ingrediente removido!')
    } catch (err: any) {
      toast.error('Erro ao excluir ingrediente: ' + (err.message || 'Erro desconhecido'))
    }
  }

  const handleDeleteList = async () => {
    if (!shoppingList) return
    const confirmed = window.confirm("Deseja realmente excluir todos os itens e apagar a lista de compras?")
    if (!confirmed) return
    try {
      await deleteList.mutateAsync(shoppingList.id)
      toast.success('Lista de compras excluída com sucesso!')
    } catch (err: any) {
      toast.error('Erro ao excluir lista: ' + (err.message || 'Erro desconhecido'))
    }
  }

  const handleAddCustomItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!shoppingList || !customName.trim()) return

    try {
      await addCustomItem.mutateAsync({
        listId: shoppingList.id,
        label: customName.trim(),
        quantity: customQty.trim() || undefined
      })
      toast.success('Item adicionado à lista!')
      setIsAddingCustom(false)
      setCustomName('')
      setCustomQty('')
    } catch (err: any) {
      toast.error('Erro ao adicionar item: ' + (err.message || 'Erro desconhecido'))
    }
  }

  if (isLoading) return <LoadingState message="Carregando lista..." />
  if (error) return <ErrorState onRetry={() => refetch()} />

  if (!shoppingList) {
    return (
      <div className="max-w-2xl mx-auto px-5 pt-8">
        <PageHeader 
          title="Lista de Compras" 
          actions={
            weeks && weeks.length > 0 ? (
              <select
                value={weekId || ''}
                onChange={(e) => {
                  const val = e.target.value
                  if (val) {
                    navigate(`/app/semana/${val}/compras`)
                  }
                }}
                className="bg-neutral-100 hover:bg-neutral-200 border-none rounded-xl py-1.5 px-3 text-xs font-bold text-text-secondary transition-all cursor-pointer focus:ring-2 focus:ring-fresh-green appearance-none pr-8 relative"
                style={{ backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236d759c' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundPosition: 'right 8px center', backgroundSize: '16px', backgroundRepeat: 'no-repeat' }}
              >
                {weeks.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.title || `Semana ${w.week_start_date}`} {w.status === 'active' ? '(Ativa)' : ''}
                  </option>
                ))}
              </select>
            ) : undefined
          }
        />
        <EmptyState
          icon={<ShoppingCart className="h-12 w-12 text-neutral-300" />}
          title="Lista não gerada"
          description="Gere sua lista automaticamente a partir das receitas da semana."
          action={
            <Button onClick={handleGenerate} disabled={generateList.isPending}>
               {generateList.isPending ? 'Gerando...' : 'Gerar Lista'}
            </Button>
          }
        />
      </div>
    )
  }

  const checkedCount = shoppingList.items?.filter((i) => i.is_checked).length || 0
  const totalCount = shoppingList.items?.length || 0

  return (
    <div className="bg-off-white min-h-screen pb-24">
      {/* Top Bar for Desktop/Mobile integration */}
      <div className="max-w-2xl mx-auto px-5 pt-6">
        
        {/* Weekly Summary Card */}
        <header className="mb-10">
          <div className="bg-white rounded-3xl p-6 border shadow-sm" style={{ borderColor: 'var(--color-outline-variant)' }}>
            <div className="flex justify-between items-start mb-6">
              <div className="min-w-0 flex-1 pr-4">
                <h2 className="text-2xl font-bold text-on-surface">Minhas Compras</h2>
                {weeks && weeks.length > 0 ? (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <select
                      value={weekId || ''}
                      onChange={(e) => {
                        const val = e.target.value
                        if (val) {
                          navigate(`/app/semana/${val}/compras`)
                        }
                      }}
                      className="bg-neutral-100 hover:bg-neutral-200 border-none rounded-xl py-1.5 px-3 text-xs font-bold text-text-secondary transition-all cursor-pointer focus:ring-2 focus:ring-fresh-green appearance-none pr-8 relative"
                      style={{ backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236d759c' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundPosition: 'right 8px center', backgroundSize: '16px', backgroundRepeat: 'no-repeat' }}
                    >
                      {weeks.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.title || `Semana ${w.week_start_date}`} {w.status === 'active' ? '(Ativa)' : ''}
                        </option>
                      ))}
                    </select>
                    <span className="text-xs text-text-secondary">• {totalCount} Itens</span>
                  </div>
                ) : (
                  <p className="text-sm text-text-secondary">
                    {selectedWeek ? (selectedWeek.title || `Semana ${selectedWeek.week_start_date}`) : 'Semana Atual'} • {totalCount} Itens
                  </p>
                )}
              </div>
              <div className="bg-primary-container text-white px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: 'var(--color-fresh-green)' }}>
                {checkedCount}/{totalCount}
              </div>
            </div>
            
            {/* Action Bar */}
            <div className="flex gap-2 pt-4 border-t" style={{ borderColor: 'var(--color-outline-variant)' }}>
               <button 
                  onClick={handleShare}
                  className="flex-1 flex items-center justify-center gap-2 bg-neutral-100 hover:bg-neutral-200 py-2.5 rounded-xl text-xs font-bold transition-all"
               >
                 <Share2 className="h-4 w-4" /> Compartilhar
               </button>
               <button 
                  onClick={() => window.print()}
                  className="flex-1 flex items-center justify-center gap-2 bg-neutral-100 hover:bg-neutral-200 py-2.5 rounded-xl text-xs font-bold transition-all"
               >
                 <Printer className="h-4 w-4" /> Imprimir
               </button>
               <button 
                  onClick={handleGenerate}
                  className="flex items-center justify-center gap-2 bg-neutral-100 hover:bg-neutral-200 p-2.5 rounded-xl text-xs font-bold transition-all"
                  title="Regenerar"
               >
                 <RefreshCw className={cn("h-4 w-4", generateList.isPending && "animate-spin")} />
               </button>
               <button 
                  onClick={handleDeleteList}
                  disabled={deleteList.isPending}
                  className="flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 p-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                  title="Excluir lista inteira"
               >
                 <Trash2 className={cn("h-4 w-4", deleteList.isPending && "animate-pulse")} />
               </button>
            </div>
          </div>

          {/* Print styling */}
          <style>{`
            @media print {
              body {
                background: white !important;
                color: black !important;
              }
              /* Hide navigation and buttons when printing */
              nav, footer, button, .sticky, header .flex:last-child {
                display: none !important;
              }
              .max-w-2xl {
                max-width: 100% !important;
                padding: 0 !important;
                margin: 0 !important;
              }
              .bg-white {
                border: none !important;
                box-shadow: none !important;
              }
            }
          `}</style>
        </header>

        {/* Sticky Search Bar */}
        <div className="sticky top-20 z-40 bg-off-white pb-6">
          <div className="relative flex items-center">
            <Search className="absolute left-4 h-5 w-5 text-warm-gray-medium" />
            <input 
              type="text"
              placeholder="Buscar na lista..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-neutral-100 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-fresh-green font-medium text-on-surface placeholder:text-warm-gray-medium"
            />
          </div>
        </div>

        {/* Checklist Sections */}
        <div className="space-y-10">
          {Object.entries(groupedItems).length === 0 ? (
            <EmptyState
              icon={<Search className="h-10 w-10 text-neutral-300" />}
              title="Nenhum item encontrado"
              description="Tente buscar por outro nome de ingrediente."
            />
          ) : (
            Object.entries(groupedItems).map(([category, catItems]) => (
              <section key={category}>
                <div className="flex items-center gap-2 mb-4 px-2">
                  <Leaf className="h-5 w-5 text-fresh-green" />
                  <h3 className="text-lg font-bold text-on-surface">{category}</h3>
                </div>
                <div 
                  className="bg-white rounded-3xl border overflow-hidden divide-y" 
                  style={{ borderColor: 'var(--color-outline-variant)' }}
                >
                  {catItems.map(item => (
                    <ShoppingChecklistItem 
                      key={item.id}
                      item={item}
                      onToggle={handleToggle}
                      onDelete={handleDeleteItem}
                    />
                  ))}
                </div>
              </section>
            ))
          )}
        </div>

        {/* Add Item Button / Form */}
        {isAddingCustom ? (
          <div className="mt-10 bg-white rounded-3xl p-6 border shadow-sm" style={{ borderColor: 'var(--color-outline-variant)' }}>
            <h4 className="text-sm font-bold text-on-surface mb-4">Novo Item Avulso</h4>
            <form onSubmit={handleAddCustomItem} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1.5">Nome do ingrediente</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Pão integral, Sal de parrilla..."
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full bg-neutral-100 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-fresh-green text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1.5">Quantidade / Medida (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: 1 pacote, 500g..."
                  value={customQty}
                  onChange={(e) => setCustomQty(e.target.value)}
                  className="w-full bg-neutral-100 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-fresh-green text-sm"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingCustom(false)
                    setCustomName('')
                    setCustomQty('')
                  }}
                  className="flex-1 bg-neutral-100 hover:bg-neutral-200 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={addCustomItem.isPending}
                  className="flex-1 text-white hover:bg-opacity-90 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                  style={{ backgroundColor: 'var(--color-highlight)' }}
                >
                  {addCustomItem.isPending ? 'Adicionando...' : 'Adicionar'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="mt-10">
            <button 
              onClick={() => setIsAddingCustom(true)}
              className="w-full border-2 border-dashed rounded-2xl p-6 text-text-secondary hover:bg-white hover:border-fresh-green hover:text-fresh-green transition-all flex items-center justify-center gap-2 cursor-pointer" 
              style={{ borderColor: 'var(--color-outline-variant)' }}
            >
              <Plus className="h-5 w-5" />
              <span className="font-bold text-sm">Adicionar item avulso</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
