import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

/**
 * Fetch user's favorite recipes.
 * Per DATABASE.md: favorite_recipes table.
 */
export function useFavorites() {
  return useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('favorite_recipes')
        .select(`
          recipe_id,
          recipe:recipes(*)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data?.map((fav) => fav.recipe) ?? []) as any
    },
  })
}

/**
 * Toggle favorite status of a recipe.
 */
export function useToggleFavorite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ recipeId, isFavorite }: { recipeId: string; isFavorite: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Unauthorized')

      if (isFavorite) {
        // Remove from favorites
        const { error } = await supabase
          .from('favorite_recipes')
          .delete()
          .eq('user_id', user.id)
          .eq('recipe_id', recipeId)
        if (error) throw error
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('favorite_recipes')
          .insert({ user_id: user.id, recipe_id: recipeId })
        if (error) throw error
      }
    },
    onSuccess: (_, { isFavorite }) => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] })
      queryClient.invalidateQueries({ queryKey: ['recipe'] }) // Refresh recipe detail if open
      toast.success(isFavorite ? 'Removido dos favoritos' : 'Adicionado aos favoritos')
    },
    onError: (error) => {
      console.error('Error toggling favorite:', error)
      toast.error('Erro ao atualizar favorito')
    },
  })
}
