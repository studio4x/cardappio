import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { DEFAULT_MEASUREMENT_UNITS_DATA } from '@/hooks/recipes/useMeasurementUnits'
import { useState } from 'react'

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
})).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))

function isTableNotFoundError(err: any) {
  const msg = err?.message || err?.details || ''
  const code = err?.code || ''
  
  // 42P01: Código do PostgreSQL para "undefined_table" (tabela não existe)
  // PGRST204: Código de erro do PostgREST (geralmente cache de esquema desatualizado)
  // Ou se a mensagem do PostgREST indica explicitamente que a relação/tabela não foi encontrada
  return (
    code === '42P01' || 
    code === 'PGRST204' || 
    msg.includes('relation "public.measurement_units" does not exist') ||
    msg.includes('relation "measurement_units" does not exist') ||
    msg.includes('could not find the relation') ||
    msg.includes('schema cache') ||
    (code === '404' && msg.includes('not found'))
  )
}

/**
 * Hook for managing measurement units in Admin Panel
 */
export function useAdminMeasurementUnits() {
  const queryClient = useQueryClient()
  const [isTableMissing, setIsTableMissing] = useState(false)

  const query = useQuery({
    queryKey: ['admin-measurement-units'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('measurement_units')
        .select('*')
        .order('name', { ascending: true })

      if (error) {
        if (isTableNotFoundError(error)) {
          setIsTableMissing(true)
        }
        return FALLBACK_ADMIN_UNITS
      }

      setIsTableMissing(false)

      if (!data || data.length === 0) {
        return FALLBACK_ADMIN_UNITS
      }

      return [...(data as MeasurementUnit[])].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
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
      setIsTableMissing(false)
      queryClient.invalidateQueries({ queryKey: ['admin-measurement-units'] })
      queryClient.invalidateQueries({ queryKey: ['measurement-units'] })
      toast.success('Unidade de medida salva com sucesso!')
    },
    onError: (err: any) => {
      console.error('Error saving measurement unit:', err)
      if (isTableNotFoundError(err)) {
        setIsTableMissing(true)
        toast.error('Tabela measurement_units não encontrada no banco. Execute a migration 045 no Supabase SQL Editor.')
      } else if (err?.code === '42501' || err?.message?.includes('violates row-level security policy')) {
        toast.error('Você não tem permissão de administrador para alterar unidades de medida.')
      } else {
        toast.error(err.message || 'Erro ao salvar unidade de medida.')
      }
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
      setIsTableMissing(false)
      queryClient.invalidateQueries({ queryKey: ['admin-measurement-units'] })
      queryClient.invalidateQueries({ queryKey: ['measurement-units'] })
      toast.success(`${data?.length || DEFAULT_MEASUREMENT_UNITS_DATA.length} unidades padrão sincronizadas no banco!`)
    },
    onError: (err: any) => {
      console.error('Error seeding default measurement units:', err)
      if (isTableNotFoundError(err)) {
        setIsTableMissing(true)
        toast.error('Tabela measurement_units não encontrada no banco Supabase. Execute a migration 045 no SQL Editor.')
      } else if (err?.code === '42501' || err?.message?.includes('violates row-level security policy')) {
        toast.error('Você não tem permissão de administrador para sincronizar unidades.')
      } else {
        toast.error(err.message || 'Erro ao sincronizar unidades padrão no banco de dados.')
      }
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (id.startsWith('default-')) {
        throw new Error('Esta unidade ainda não está salva no banco de dados. Execute a migration 045 no Supabase.')
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
      if (isTableNotFoundError(err)) {
        setIsTableMissing(true)
        toast.error('Tabela measurement_units não encontrada no banco. Execute a migration 045 no Supabase SQL Editor.')
      } else if (err?.code === '42501' || err?.message?.includes('violates row-level security policy')) {
        toast.error('Você não tem permissão de administrador para remover unidades.')
      } else {
        toast.error(err.message || 'Erro ao remover unidade de medida.')
      }
    }
  })

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active, unit }: { id: string; is_active: boolean; unit?: MeasurementUnit }) => {
      if (id.startsWith('default-') && unit) {
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
      setIsTableMissing(false)
      queryClient.invalidateQueries({ queryKey: ['admin-measurement-units'] })
      queryClient.invalidateQueries({ queryKey: ['measurement-units'] })
      toast.success('Status da unidade atualizado!')
    },
    onError: (err: any) => {
      console.error('Error toggling measurement unit status:', err)
      if (isTableNotFoundError(err)) {
        setIsTableMissing(true)
        toast.error('Tabela measurement_units não encontrada no banco. Execute a migration 045 no Supabase SQL Editor.')
      } else if (err?.code === '42501' || err?.message?.includes('violates row-level security policy')) {
        toast.error('Você não tem permissão de administrador para alterar o status da unidade.')
      } else {
        toast.error(err.message || 'Erro ao alterar status da unidade.')
      }
    }
  })

  return {
    units: query.data || FALLBACK_ADMIN_UNITS,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isTableMissing,
    refetch: query.refetch,
    saveMutation,
    deleteMutation,
    toggleActiveMutation,
    seedDefaultsMutation
  }
}
