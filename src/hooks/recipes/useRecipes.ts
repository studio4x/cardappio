import { useQuery, keepPreviousData } from '@tanstack/react-query'
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
  isPremium?: boolean
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}) {
  return useQuery({
    queryKey: [
      'recipes',
      filters?.search ?? '',
      filters?.categoryId ?? '',
      filters?.difficulty ?? '',
      filters?.status ?? 'published',
      filters?.isPremium ?? null,
      filters?.page ?? 1,
      filters?.pageSize ?? 10,
      filters?.sortBy ?? 'created_at',
      filters?.sortOrder ?? 'desc',
    ],
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
          ingredients:recipe_ingredients!recipe_ingredients_recipe_id_fkey(*, linked_recipe:recipes!linked_recipe_id(id, slug, title)),
          steps:recipe_steps(*),
          tags:recipe_tag_links(tag:recipe_tags(*)),
          creator:profiles!created_by(id, full_name, role)
        `, { count: 'exact' })

      // Ordenação dinâmica com base nos filtros
      const sortBy = filters?.sortBy || 'created_at'
      const sortOrder = filters?.sortOrder || 'desc'
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })

      // Mantém a ordenação dos relacionamentos internos
      query = query
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

      if (filters?.isPremium !== undefined) {
        query = query.eq('is_premium', filters.isPremium)
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
    /**
     * Keep the previous page's data visible while the new query loads.
     * This prevents the list from going blank on every keystroke or page change.
     */
    placeholderData: keepPreviousData,
    staleTime: 10_000, // 10 s — avoid redundant refetches within same browsing session
  })
}

/**
 * Fetch a single recipe by slug or ID.
 */
export function useRecipe(slugOrId: string | undefined) {
  return useQuery({
    queryKey: ['recipe', slugOrId],
    queryFn: async () => {
      if (!slugOrId) return null

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId)

      let query = supabase
        .from('recipes')
        .select(`
          *,
          category:recipe_categories(*),
          ingredients:recipe_ingredients!recipe_ingredients_recipe_id_fkey(*, linked_recipe:recipes!linked_recipe_id(id, slug, title)),
          steps:recipe_steps(*),
          tags:recipe_tag_links(tag:recipe_tags(*)),
          variations:recipe_variations!parent_recipe_id(*),
          creator:profiles!created_by(id, full_name, role)
        `)

      if (isUuid) {
        query = query.eq('id', slugOrId)
      } else {
        query = query.eq('slug', slugOrId)
      }

      const { data, error } = await query
        .order('sort_order', { foreignTable: 'recipe_ingredients' })
        .order('step_number', { foreignTable: 'recipe_steps' })
        .maybeSingle()

      if (error && error.code !== 'PGRST116') throw error

      if (!data && !isUuid) {
        const { data: fallbackData } = await supabase
          .from('recipes')
          .select(`
            *,
            category:recipe_categories(*),
            ingredients:recipe_ingredients!recipe_ingredients_recipe_id_fkey(*, linked_recipe:recipes!linked_recipe_id(id, slug, title)),
            steps:recipe_steps(*),
            tags:recipe_tag_links(tag:recipe_tags(*)),
            variations:recipe_variations!parent_recipe_id(*),
            creator:profiles!created_by(id, full_name, role)
          `)
          .eq('id', slugOrId)
          .maybeSingle()

        if (fallbackData) {
          return fallbackData as Recipe
        }
      }

      return (data ?? null) as Recipe | null
    },
    enabled: !!slugOrId,
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

/**
 * Fetch active recipe tags.
 */
export function useRecipeTags() {
  return useQuery({
    queryKey: ['recipe-tags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recipe_tags')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      return data ?? []
    },
  })
}
