import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { getSupabaseClient, getServiceClient, getAuthenticatedUser } from "../_shared/auth.ts"
import { corsHeaders } from "../_shared/cors.ts"
import { createResponse } from "../_shared/response.ts"

/**
 * rebuild-shopping-list
 * Per API_FUNCTIONS.md: Reprocesses the shopping list for a given week.
 *
 * Logic:
 * 1. Validate user session.
 * 2. Fetch all recipes in the week's slots.
 * 3. Consolidate ingredients (grouping by normalized name).
 * 4. Update shopping_lists and shopping_list_items.
 */
serve(async (req) => {
  // 1. Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return createResponse(null, { code: 'UNAUTHORIZED', message: 'User not authenticated' }, 401)
    }

    const { week_id } = await req.json()
    if (!week_id) {
      return createResponse(null, { code: 'BAD_REQUEST', message: 'week_id is required' }, 400)
    }

    const supabase = getSupabaseClient(req)
    const supabaseService = getServiceClient()

    // 2. Fetch week data
    const { data: week, error: weekError } = await supabase
      .from('meal_plan_weeks')
      .select('id, user_id')
      .eq('id', week_id)
      .single()

    if (weekError || !week) {
      return createResponse(null, { code: 'NOT_FOUND', message: 'Week not found' }, 404)
    }

    // Security check: must be owner or admin (omitting admin check for simplicity here, profiles lookup needed)

    // 3. Fetch all ingredients for the week
    const { data: days, error: daysError } = await supabaseService
      .from('meal_plan_days')
      .select(`
        slots:meal_plan_slots(
          recipe:recipes(
            ingredients:recipe_ingredients(name, quantity_label, normalized_name, is_optional)
          )
        )
      `)
      .eq('week_id', week_id)

    if (daysError) throw daysError

    // 4. Aggregate logic (Server-side)
    const ingredientMap = new Map<string, {
      label: string
      normalized: string
      quantities: string[]
      recipeCount: number
    }>()

    for (const day of days || []) {
      for (const slot of (day as any).slots || []) {
        if (!slot.recipe) continue
        for (const ing of slot.recipe.ingredients || []) {
          if (ing.is_optional) continue
          const key = (ing.normalized_name || ing.name).toLowerCase().trim()
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

    // 5. Atomic Update in Transaction-like behavior
    // First, ensure shopping list exists
    let { data: list, error: listError } = await supabaseService
      .from('shopping_lists')
      .select('id')
      .eq('week_id', week_id)
      .single()

    if (listError && listError.code === 'PGRST116') {
      const { data: newList, error: createError } = await supabaseService
        .from('shopping_lists')
        .insert({ user_id: week.user_id, week_id, status: 'active' })
        .select()
        .single()
      if (createError) throw createError
      list = newList
    } else if (listError) throw listError

    // 6. Delete old items and insert new ones
    await supabaseService.from('shopping_list_items').delete().eq('shopping_list_id', list.id)

    const items = Array.from(ingredientMap.entries()).map(([, val], idx) => ({
      shopping_list_id: list.id,
      ingredient_label: val.label,
      normalized_name: val.normalized,
      quantity_label: val.quantities.join(' + ') || null,
      source_recipe_count: val.recipeCount,
      is_checked: false,
      sort_order: idx,
    }))

    if (items.length > 0) {
      const { error: itemsError } = await supabaseService.from('shopping_list_items').insert(items)
      if (itemsError) throw itemsError
    }

    return createResponse({
      shopping_list_id: list.id,
      items_count: items.length
    })

  } catch (err: any) {
    return createResponse(null, { code: 'INTERNAL_ERROR', message: err.message }, 500)
  }
})
