import { ShoppingCart, RefreshCw, Loader2, Package, Share2, Copy, Check } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { EmptyState } from '@/components/shared/EmptyState'
import { useShoppingList, useGenerateShoppingList, useToggleShoppingItem, useShareResource } from '@/hooks/shopping/useShopping'
import { useActiveWeek } from '@/hooks/planning/usePlanning'
import { ShoppingChecklistItem } from '@/components/shopping/ShoppingChecklistItem'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useState } from 'react'

/**
 * ShoppingListPage (Screen 12)
 *
 * Per SCREENS.md and CODEX_CARDAPPIO_APP_SPEC.md:
 * - Auto-generated from week's recipe ingredients
 * - Checklist with toggle
 * - Regenerate button
 * - Shows recipe count per ingredient
 */
export function ShoppingListPage() {
  const { weekId: routeWeekId } = useParams()
  const [searchParams] = useSearchParams()
  const { data: activeWeek } = useActiveWeek()

  // Use route weekId or active week
  const weekId = routeWeekId ?? activeWeek?.id

  const { data: shoppingList, isLoading, error, refetch } = useShoppingList(weekId)
  const generateList = useGenerateShoppingList()
  const toggleItem = useToggleShoppingItem()
  const shareResource = useShareResource()
  const [isCopying, setIsCopying] = useState(false)

  const handleShare = async () => {
    if (!shoppingList) return
    try {
      const data = await shareResource.mutateAsync({
        resourceType: 'list',
        resourceId: shoppingList.id
      })
      
      const fullUrl = `${window.location.origin}/compartilhar/${data.token}`
      await navigator.clipboard.writeText(fullUrl)
      
      toast.success('Link de compartilhamento copiado!', {
        description: 'Válido por 24 horas.'
      })
    } catch (err) {
      toast.error('Erro ao gerar link de compartilhamento')
    }
  }

  const handleGenerate = async () => {
    if (!weekId) return
    try {
      await generateList.mutateAsync(weekId)
    } catch (err) {
      console.error('Error generating shopping list:', err)
    }
  }

  const handleToggle = async (itemId: string, currentState: boolean) => {
    try {
      await toggleItem.mutateAsync({ itemId, isChecked: !currentState })
    } catch (err) {
      console.error('Error toggling item:', err)
    }
  }

  if (isLoading) return <LoadingState message="Carregando lista..." />
  if (error) return <ErrorState onRetry={() => refetch()} />

  // No list yet — prompt to generate
  if (!shoppingList) {
    return (
      <div>
        <PageHeader title="Lista de Compras" />
        <EmptyState
          icon={<ShoppingCart className="h-8 w-8" />}
          title="Lista ainda não gerada"
          description="Gere a lista de compras automaticamente a partir das receitas da sua semana."
          action={
            <button
              onClick={handleGenerate}
              disabled={generateList.isPending || !weekId}
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 cursor-pointer"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              {generateList.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShoppingCart className="h-4 w-4" />
              )}
              {generateList.isPending ? 'Gerando...' : 'Gerar lista de compras'}
            </button>
          }
        />
      </div>
    )
  }

  const items = [...(shoppingList.items ?? [])].sort((a, b) => {
    // Checked items go to bottom
    if (a.is_checked !== b.is_checked) return a.is_checked ? 1 : -1
    return a.sort_order - b.sort_order
  })

  const checkedCount = items.filter((i) => i.is_checked).length
  const totalCount = items.length

  return (
    <div>
      <PageHeader
        title="Lista de Compras"
        subtitle={`${checkedCount} de ${totalCount} itens concluídos`}
        actions={
          <div className="flex gap-2">
            <button
              onClick={handleShare}
              disabled={shareResource.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold transition-all hover:bg-slate-100 cursor-pointer text-slate-600"
              title="Compartilhar lista"
            >
              {shareResource.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Share2 className="h-4 w-4" />
              )}
              Compartilhar
            </button>
            <button
              onClick={handleGenerate}
              disabled={generateList.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold transition-all hover:bg-emerald-50 cursor-pointer"
              style={{ color: 'var(--color-primary)' }}
              title="Regenerar lista"
            >
              {generateList.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Regenerar
            </button>
          </div>
        }
      />

      {/* Progress bar */}
      <div className="mb-6">
        <div
          className="h-2 rounded-full overflow-hidden"
          style={{ backgroundColor: 'var(--color-surface-container-high)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: totalCount > 0 ? `${(checkedCount / totalCount) * 100}%` : '0%',
              backgroundColor: checkedCount === totalCount ? 'var(--color-success)' : 'var(--color-primary)',
            }}
          />
        </div>
      </div>

      {/* Items */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{
          backgroundColor: 'var(--color-surface-container-lowest)',
          borderColor: 'var(--color-outline-variant)',
        }}
      >
        {items.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={<Package className="h-8 w-8" />}
              title="Lista vazia"
              description="Adicione receitas à sua semana para gerar a lista."
            />
          </div>
        ) : (
          <ul className="divide-y" style={{ borderColor: 'var(--color-outline-variant)' }}>
            {items.map((item) => (
              <ShoppingChecklistItem 
                key={item.id} 
                item={item} 
                onToggle={handleToggle} 
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
