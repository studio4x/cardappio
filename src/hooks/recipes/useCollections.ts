import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

/**
 * Fetch editorial recipe collections.
 * Per DATABASE.md (Lote 4).
 */
export function useCollections() {
  return useQuery({
    queryKey: ['recipe-collections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recipe_collections')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')

      if (error) throw error
      return data ?? []
    },
  })
}

/**
 * Fetch a single collection by slug with its recipes.
 */
export function useCollection(slug: string | undefined) {
  return useQuery({
    queryKey: ['collection', slug],
    queryFn: async () => {
      if (!slug) return null

      const { data, error } = await supabase
        .from('recipe_collections')
        .select(`
          *,
          items:recipe_collection_items(
            recipe:recipes(
              *,
              category:recipe_categories(*)
            )
          )
        `)
        .eq('slug', slug)
        .eq('is_active', true)
        .single()

      if (error) throw error
      
      // Flatten the recipes
      const flattenedRecipes = data.items?.map((item: any) => item.recipe) ?? []
      
      return {
        ...data,
        recipes: flattenedRecipes
      }
    },
    enabled: !!slug,
  })
}

/**
 * Fetch active editorial notices (Tips, Alerts).
 */
export function useEditorialNotices() {
  return useQuery({
    queryKey: ['editorial-notices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('editorial_notices')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data ?? []
    },
  })
}
