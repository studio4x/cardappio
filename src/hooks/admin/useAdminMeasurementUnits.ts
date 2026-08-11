import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export interface MeasurementUnit {
  id: string
  name: string
  symbol: string
  category: string | null
  sort_order: number
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export type MeasurementUnitInput = Omit<MeasurementUnit, 'id' | 'created_at' | 'updated_at'> & {
  id?: string
}

/**
 * Hook for managing measurement units in Admin Panel
 */
export function useAdminMeasurementUnits() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['admin-measurement-units'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('measurement_units')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true })

      if (error) {
        console.error('Error fetching admin measurement units:', error)
        throw error
      }
      return (data || []) as MeasurementUnit[]
    }
  })

  const saveMutation = useMutation({
    mutationFn: async (unit: MeasurementUnitInput) => {
      const payload = {
        ...(unit.id ? { id: unit.id } : {}),
        name: unit.name.trim(),
        symbol: unit.symbol.trim().toLowerCase(),
        category: unit.category?.trim() || 'Geral',
        sort_order: Number(unit.sort_order) || 0,
        is_active: unit.is_active ?? true,
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('measurement_units')
        .upsert(payload)
        .select()
        .single()

      if (error) throw error
      return data as MeasurementUnit
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-measurement-units'] })
      queryClient.invalidateQueries({ queryKey: ['measurement-units'] })
      toast.success('Unidade de medida salva com sucesso!')
    },
    onError: (err: any) => {
      console.error('Error saving measurement unit:', err)
      toast.error(err.message || 'Erro ao salvar unidade de medida.')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('measurement_units')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-measurement-units'] })
      queryClient.invalidateQueries({ queryKey: ['measurement-units'] })
      toast.success('Unidade de medida removida.')
    },
    onError: (err: any) => {
      console.error('Error deleting measurement unit:', err)
      toast.error(err.message || 'Erro ao remover unidade de medida.')
    }
  })

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('measurement_units')
        .update({ is_active, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-measurement-units'] })
      queryClient.invalidateQueries({ queryKey: ['measurement-units'] })
      toast.success('Status da unidade atualizado!')
    },
    onError: (err: any) => {
      console.error('Error toggling measurement unit status:', err)
      toast.error(err.message || 'Erro ao alterar status da unidade.')
    }
  })

  return {
    units: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    saveMutation,
    deleteMutation,
    toggleActiveMutation
  }
}
