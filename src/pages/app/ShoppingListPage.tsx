import { ShoppingCart, RefreshCw, Loader2, Package, Share2, Search, Utensils, Plus, EcoIcon, Fridge, InventoryIcon, Apple, Leaf, Milk, Beef } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { EmptyState } from '@/components/shared/EmptyState'
import { useShoppingList, useGenerateShoppingList, useToggleShoppingItem, useShareResource } from '@/hooks/shopping/useShopping'
import { useActiveWeek } from '@/hooks/planning/usePlanning'
import { ShoppingChecklistItem } from '@/components/shopping/ShoppingChecklistItem'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useParams } from 'react-router-dom'
import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'

export function ShoppingListPage() {
  const { weekId: routeWeekId } = useParams()
  const { data: activeWeek } = useActiveWeek()
  const [searchTerm, setSearchTerm] = useState('')

  const weekId = routeWeekId ?? activeWeek?.id

  const { data: shoppingList, isLoading, error, refetch } = useShoppingList(weekId)
  const generateList = useGenerateShoppingList()
  const toggleItem = useToggleShoppingItem()
  const shareResource = useShareResource()

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
      const cat = item.category || 'Outros'
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
    } catch (err) {}
  }

  const handleToggle = async (itemId: string, currentState: boolean) => {
    try {
      await toggleItem.mutateAsync({ itemId, isChecked: !currentState })
    } catch (err) {}
  }

  if (isLoading) return <LoadingState message="Carregando lista..." />
  if (error) return <ErrorState onRetry={() => refetch()} />

  if (!shoppingList) {
    return (
      <div className="max-w-2xl mx-auto px-5 pt-8">
        <PageHeader title="Lista de Compras" />
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
              <div>
                <h2 className="text-2xl font-bold text-on-surface">Minhas Compras</h2>
                <p className="text-sm text-text-secondary">
                  {activeWeek ? `Semana ${activeWeek.week_start_date}` : 'Semana Atual'} • {totalCount} Items
                </p>
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
                  onClick={handleGenerate}
                  className="flex items-center justify-center gap-2 bg-neutral-100 hover:bg-neutral-200 p-2.5 rounded-xl text-xs font-bold transition-all"
                  title="Regenerar"
               >
                 <RefreshCw className={cn("h-4 w-4", generateList.isPending && "animate-spin")} />
               </button>
            </div>
          </div>
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
                    />
                  ))}
                </div>
              </section>
            ))
          )}
        </div>

        {/* Add Item Button */}
        <div className="mt-10">
          <button className="w-full border-2 border-dashed rounded-2xl p-6 text-text-secondary hover:bg-white hover:border-fresh-green hover:text-fresh-green transition-all flex items-center justify-center gap-2" style={{ borderColor: 'var(--color-outline-variant)' }}>
            <Plus className="h-5 w-5" />
            <span className="font-bold text-sm">Adicionar item avulso</span>
          </button>
        </div>
      </div>
    </div>
  )
}
