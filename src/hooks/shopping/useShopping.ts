import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/app/providers/AuthProvider'
import type { ShoppingList, ShoppingListItem } from '@/types/shopping'

/**
 * Fetch shopping list for a given week.
 * Per CODEX_CARDAPPIO_APP_SPEC.md: list is auto-generated from recipe ingredients.
 */
export function useShoppingList(weekId: string | undefined) {
  const { supabaseUser } = useAuth()

  return useQuery({
    queryKey: ['shopping-list', weekId],
    queryFn: async () => {
      if (!weekId || !supabaseUser) return null

      const { data, error } = await supabase
        .from('shopping_lists')
        .select(`
          *,
          items:shopping_list_items(*)
        `)
        .eq('user_id', supabaseUser.id)
        .eq('week_id', weekId)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return (data as ShoppingList) ?? null
    },
    enabled: !!weekId && !!supabaseUser,
  })
}

/**
 * Generate (or regenerate) shopping list from the week's recipes.
 * This runs client-side: collects ingredients from all slots and upserts.
 */
export function useGenerateShoppingList() {
  const queryClient = useQueryClient()
  const { supabaseUser } = useAuth()

  return useMutation({
    mutationFn: async (weekId: string) => {
      if (!supabaseUser) throw new Error('Not authenticated')

      const { data, error } = await supabase.functions.invoke('rebuild-shopping-list', {
        body: { week_id: weekId }
      })

      if (error) throw error
      if (!data.success) throw new Error(data.error?.message || 'Failed to rebuild list')

      return data.data
    },
    onSuccess: (_, weekId) => {
      queryClient.invalidateQueries({ queryKey: ['shopping-list', weekId] })
    },
  })
}

/**
 * Toggle check status on a shopping list item.
 */
export function useToggleShoppingItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      itemId,
      isChecked,
    }: {
      itemId: string
      isChecked: boolean
    }) => {
      const { error } = await supabase
        .from('shopping_list_items')
        .update({ is_checked: isChecked })
        .eq('id', itemId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-list'] })
    },
  })
}
