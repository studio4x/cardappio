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
      if (data.error) throw new Error(data.error.message || 'Failed to rebuild list')

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

/**
 * Generate a shareable link for a week or shopping list.
 */
export function useShareResource() {
  const { supabaseUser } = useAuth()

  return useMutation({
    mutationFn: async ({
      resourceType,
      resourceId,
      expiresInHours = 24
    }: {
      resourceType: 'week' | 'list'
      resourceId: string
      expiresInHours?: number
    }) => {
      if (!supabaseUser) throw new Error('Not authenticated')

      const { data, error } = await supabase.functions.invoke('generate-share-link', {
        body: { 
          resource_type: resourceType, 
          resource_id: resourceId,
          expires_in_hours: expiresInHours
        }
      })

      if (error) throw error
      if (data.error) throw new Error(data.error.message || 'Failed to generate link')

      return data.data // { token, share_url, expires_at }
    }
  })
}

/**
 * Delete a single shopping list item.
 */
export function useDeleteShoppingItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('shopping_list_items')
        .delete()
        .eq('id', itemId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-list'] })
    },
  })
}

/**
 * Delete the entire shopping list (items are cascade deleted).
 */
export function useDeleteShoppingList() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (listId: string) => {
      const { error } = await supabase
        .from('shopping_lists')
        .delete()
        .eq('id', listId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-list'] })
    },
  })
}

/**
 * Add a custom item to the shopping list.
 */
export function useAddShoppingItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      listId,
      label,
      quantity,
    }: {
      listId: string
      label: string
      quantity?: string
    }) => {
      const { error } = await supabase
        .from('shopping_list_items')
        .insert({
          shopping_list_id: listId,
          ingredient_label: label,
          quantity_label: quantity || null,
          source_recipe_count: 1,
          is_checked: false,
        })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-list'] })
    },
  })
}


