import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

/**
 * Hook for managing editorial collections (Admin)
 */
export function useAdminCollections() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['admin-collections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recipe_collections')
        .select('*')
        .order('sort_order', { ascending: true })
      if (error) throw error
      return data
    }
  })

  const saveMutation = useMutation({
    mutationFn: async (collection: any) => {
      const { data, error } = await supabase
        .from('recipe_collections')
        .upsert(collection)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-collections'] })
      queryClient.invalidateQueries({ queryKey: ['recipe-collections'] })
      toast.success('Coleção salva com sucesso!')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('recipe_collections')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-collections'] })
      queryClient.invalidateQueries({ queryKey: ['recipe-collections'] })
      toast.success('Coleção removida.')
    }
  })

  return { ...query, saveMutation, deleteMutation }
}

/**
 * Hook for managing editorial notices (Admin)
 */
export function useAdminNotices() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['admin-notices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('editorial_notices')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    }
  })

  const saveMutation = useMutation({
    mutationFn: async (notice: any) => {
      const { data, error } = await supabase
        .from('editorial_notices')
        .upsert(notice)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notices'] })
      queryClient.invalidateQueries({ queryKey: ['editorial-notices'] })
      toast.success('Aviso/Dica salvo!')
    }
  })

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string, is_active: boolean }) => {
      const { error } = await supabase
        .from('editorial_notices')
        .update({ is_active })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notices'] })
    }
  })

  return { ...query, saveMutation, toggleStatusMutation }
}
