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
  status?: 'published' | 'draft' | 'archived' | 'all'
  page?: number
  pageSize?: number
}) {
  return useQuery({
    queryKey: ['recipes', filters],
    queryFn: async () => {
      const page = filters?.page || 1
      const pageSize = filters?.pageSize || 10
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      let query = supabase
        .from('recipes')
        .select(`
          *,
          category:recipe_categories(*),
          ingredients:recipe_ingredients(*),
          steps:recipe_steps(*),
          tags:recipe_tag_links(tag:recipe_tags(*)),
          creator:profiles!created_by(id, full_name, role)
        `, { count: 'exact' })
        .order('created_at', { ascending: false }) // Novas primeiro
        .order('sort_order', { foreignTable: 'recipe_ingredients' })
        .order('step_number', { foreignTable: 'recipe_steps' })

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status)
      } else if (!filters?.status) {
        query = query.eq('status', 'published')
      }

      if (filters?.categoryId) {
        query = query.eq('category_id', filters.categoryId)
      }

      if (filters?.difficulty) {
        query = query.eq('difficulty_level', filters.difficulty)
      }

      if (filters?.search) {
        query = query.ilike('title', `%${filters.search}%`)
      }

      // Pagination
      if (filters?.pageSize) {
        query = query.range(from, to)
      }

      const { data, error, count } = await query

      if (error) throw error
      return {
        recipes: (data ?? []) as Recipe[],
        count: count || 0
      }
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
          variations:recipe_variations!parent_recipe_id(*),
          creator:profiles!created_by(id, full_name, role)
        `)
        .eq('slug', slug)
        .eq('status', 'published')
        .order('sort_order', { foreignTable: 'recipe_ingredients' })
        .order('step_number', { foreignTable: 'recipe_steps' })
        .maybeSingle()

      // PGRST116 = no rows returned (recipe blocked by RLS or not found)
      if (error && error.code !== 'PGRST116') throw error
      return (data ?? null) as Recipe | null
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
