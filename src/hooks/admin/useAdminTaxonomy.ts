import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

/**
 * Hook for managing recipe categories (Admin)
 */
export function useAdminCategories() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recipe_categories')
        .select('*')
        .order('sort_order', { ascending: true })
      if (error) throw error
      return data
    }
  })

  const saveMutation = useMutation({
    mutationFn: async (category: any) => {
      const { data, error } = await supabase
        .from('recipe_categories')
        .upsert(category)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
      toast.success('Categoria salva com sucesso!')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('recipe_categories')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
      toast.success('Categoria removida.')
    }
  })

  return { ...query, saveMutation, deleteMutation }
}

/**
 * Hook for managing recipe tags (Admin)
 */
export function useAdminTags() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['admin-tags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recipe_tags')
        .select('*')
        .order('name', { ascending: true })
      if (error) throw error
      return data
    }
  })

  const saveMutation = useMutation({
    mutationFn: async (tag: any) => {
      const { data, error } = await supabase
        .from('recipe_tags')
        .upsert(tag)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tags'] })
      toast.success('Tag salva com sucesso!')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('recipe_tags')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tags'] })
      toast.success('Tag removida.')
    }
  })

  return { ...query, saveMutation, deleteMutation }
}
