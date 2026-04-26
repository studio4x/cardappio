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
          ingredients:recipe_ingredients(*),
          steps:recipe_steps(*),
          tags:recipe_tag_links(tag:recipe_tags(*))
        `)
        .eq('status', 'published')
        .order('title')
        .order('sort_order', { foreignTable: 'recipe_ingredients' })
        .order('step_number', { foreignTable: 'recipe_steps' })

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
          ingredients:recipe_ingredients(*),
          steps:recipe_steps(*),
          tags:recipe_tag_links(tag:recipe_tags(*)),
          variations:recipe_variations!parent_recipe_id(*)
        `)
        .eq('slug', slug)
        .eq('status', 'published')
        .order('sort_order', { foreignTable: 'recipe_ingredients' })
        .order('step_number', { foreignTable: 'recipe_steps' })
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
