import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { DEFAULT_MEASUREMENT_UNITS_DATA } from '@/hooks/recipes/useMeasurementUnits'

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

const FALLBACK_ADMIN_UNITS: MeasurementUnit[] = DEFAULT_MEASUREMENT_UNITS_DATA.map((item, idx) => ({
  id: `default-${idx}`,
  name: item.name,
  symbol: item.symbol,
  category: item.category,
  sort_order: item.sort_order,
  is_active: true
}))

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
        console.warn('Error or table missing for admin measurement units, using fallback:', error.message)
        return FALLBACK_ADMIN_UNITS
      }

      if (!data || data.length === 0) {
        return FALLBACK_ADMIN_UNITS
      }

      return data as MeasurementUnit[]
    }
  })

  const saveMutation = useMutation({
    mutationFn: async (unit: MeasurementUnitInput) => {
      const payload = {
        ...(unit.id && !unit.id.startsWith('default-') ? { id: unit.id } : {}),
        name: unit.name.trim(),
        symbol: unit.symbol.trim().toLowerCase(),
        category: unit.category?.trim() || 'Geral',
        sort_order: Number(unit.sort_order) || 0,
        is_active: unit.is_active ?? true,
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('measurement_units')
        .upsert(payload, { onConflict: 'symbol' })
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

  const seedDefaultsMutation = useMutation({
    mutationFn: async () => {
      const records = DEFAULT_MEASUREMENT_UNITS_DATA.map(item => ({
        name: item.name,
        symbol: item.symbol,
        category: item.category,
        sort_order: item.sort_order,
        is_active: true,
        updated_at: new Date().toISOString()
      }))

      const { data, error } = await supabase
        .from('measurement_units')
        .upsert(records, { onConflict: 'symbol' })
        .select()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-measurement-units'] })
      queryClient.invalidateQueries({ queryKey: ['measurement-units'] })
      toast.success(`${data?.length || DEFAULT_MEASUREMENT_UNITS_DATA.length} unidades padrão sincronizadas com sucesso no banco!`)
    },
    onError: (err: any) => {
      console.error('Error seeding default measurement units:', err)
      toast.error(err.message || 'Erro ao sincronizar unidades padrão no banco de dados.')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (id.startsWith('default-')) {
        throw new Error('Esta unidade ainda não está salva no banco de dados. Clique em "Sincronizar Unidades Padrão" primeiro.')
      }

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
    mutationFn: async ({ id, is_active, unit }: { id: string; is_active: boolean; unit?: MeasurementUnit }) => {
      if (id.startsWith('default-') && unit) {
        // Save to DB first with updated is_active
        const payload = {
          name: unit.name,
          symbol: unit.symbol,
          category: unit.category || 'Geral',
          sort_order: unit.sort_order,
          is_active,
          updated_at: new Date().toISOString()
        }
        const { error } = await supabase
          .from('measurement_units')
          .upsert(payload, { onConflict: 'symbol' })
        if (error) throw error
        return
      }

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
    units: query.data || FALLBACK_ADMIN_UNITS,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    saveMutation,
    deleteMutation,
    toggleActiveMutation,
    seedDefaultsMutation
  }
}
