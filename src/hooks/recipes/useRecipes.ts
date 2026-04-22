import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import type { Recipe } from '@/types/recipes'

/**
 * Fetch published recipes with optional filters.
 * Per CODEX_CARDAPPIO_APP_SPEC.md: recipe browsing for the planner.
 */
export function useRecipes(filters?: {
  categoryId?: string
  difficulty?: string
  search?: string
}) {
  return useQuery({
    queryKey: ['recipes', filters],
    queryFn: async () => {
      let query = supabase
        .from('recipes')
        .select(`
          *,
          category:recipe_categories(*),
          ingredients:recipe_ingredients(*, order:sort_order),
          steps:recipe_steps(*, order:step_number),
          tags:recipe_tag_links(tag:recipe_tags(*))
        `)
        .eq('status', 'published')
        .order('title')

      if (filters?.categoryId) {
        query = query.eq('category_id', filters.categoryId)
      }

      if (filters?.difficulty) {
        query = query.eq('difficulty_level', filters.difficulty)
      }

      if (filters?.search) {
        query = query.ilike('title', `%${filters.search}%`)
      }

      const { data, error } = await query

      if (error) throw error
      return (data ?? []) as Recipe[]
    },
  })
}

/**
 * Fetch a single recipe by slug.
 */
export function useRecipe(slug: string | undefined) {
  return useQuery({
    queryKey: ['recipe', slug],
    queryFn: async () => {
      if (!slug) return null

      const { data, error } = await supabase
        .from('recipes')
        .select(`
          *,
          category:recipe_categories(*),
          ingredients:recipe_ingredients(*, order:sort_order),
          steps:recipe_steps(*, order:step_number),
          tags:recipe_tag_links(tag:recipe_tags(*)),
          variations:recipe_variations(*)
        `)
        .eq('slug', slug)
        .eq('status', 'published')
        .single()

      if (error) throw error
      return data as Recipe
    },
    enabled: !!slug,
  })
}

/**
 * Fetch recipe categories.
 */
export function useRecipeCategories() {
  return useQuery({
    queryKey: ['recipe-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recipe_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')

      if (error) throw error
      return data ?? []
    },
  })
}
