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

      // 1. Fetch all slots with recipes and ingredients for this week
      const { data: days, error: daysError } = await supabase
        .from('meal_plan_days')
        .select(`
          slots:meal_plan_slots(
            recipe:recipes(
              id,
              ingredients:recipe_ingredients(name, quantity_label, normalized_name, is_optional)
            )
          )
        `)
        .eq('week_id', weekId)

      if (daysError) throw daysError

      // 2. Aggregate ingredients from all recipes
      const ingredientMap = new Map<string, {
        label: string
        normalized: string
        quantities: string[]
        recipeCount: number
      }>()

      for (const day of days ?? []) {
        for (const slot of (day as { slots: Array<{ recipe: { id: string, ingredients: Array<{ name: string, quantity_label: string | null, normalized_name: string | null, is_optional: boolean }> } | null }> }).slots ?? []) {
          if (!slot.recipe) continue
          for (const ing of slot.recipe.ingredients ?? []) {
            if (ing.is_optional) continue
            const key = (ing.normalized_name ?? ing.name).toLowerCase().trim()
            const existing = ingredientMap.get(key)
            if (existing) {
              existing.recipeCount++
              if (ing.quantity_label) existing.quantities.push(ing.quantity_label)
            } else {
              ingredientMap.set(key, {
                label: ing.name,
                normalized: key,
                quantities: ing.quantity_label ? [ing.quantity_label] : [],
                recipeCount: 1,
              })
            }
          }
        }
      }

      // 3. Delete existing shopping list for this week (if any)
      await supabase
        .from('shopping_lists')
        .delete()
        .eq('user_id', supabaseUser.id)
        .eq('week_id', weekId)

      // 4. Create new shopping list
      const { data: list, error: listError } = await supabase
        .from('shopping_lists')
        .insert({
          user_id: supabaseUser.id,
          week_id: weekId,
          status: 'active',
          generated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (listError) throw listError

      // 5. Insert items
      const items = Array.from(ingredientMap.entries()).map(([, value], idx) => ({
        shopping_list_id: list.id,
        ingredient_label: value.label,
        normalized_name: value.normalized,
        quantity_label: value.quantities.join(' + ') || null,
        source_recipe_count: value.recipeCount,
        is_checked: false,
        sort_order: idx,
      }))

      if (items.length > 0) {
        const { error: itemsError } = await supabase
          .from('shopping_list_items')
          .insert(items)

        if (itemsError) throw itemsError
      }

      return list as ShoppingList
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
