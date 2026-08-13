import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export interface RecipeAutomationTarget {
  category_slug: string
  quantity: number
}

export interface RecipeAutomationConfig {
  version: number
  enabled: boolean
  timezone: 'America/Sao_Paulo'
  targets: RecipeAutomationTarget[]
  schedule: {
    days_of_week: number[]
    time: string
  }
}

export interface RecipeAutomationCategory {
  name: string
  slug: string
  sort_order: number
}

export interface RecipeAutomationRunLog {
  status: string
  processed_count: number
  metadata_json: Record<string, unknown> | null
  created_at: string
}

export interface RecipeAutomationState {
  ok: boolean
  config: RecipeAutomationConfig
  runtime: {
    active_run_id?: string
    active_run_started_at?: string
    active_trigger?: string
    active_slot_key?: string
    manual_request?: {
      id?: string
      requested_at?: string
    }
    last_run?: {
      run_id?: string
      status?: string
      trigger_type?: string
      slot_key?: string
      started_at?: string
      completed_at?: string
      summary?: {
        totals?: {
          candidates?: number
          created?: number
          duplicates?: number
          failed?: number
          skipped?: number
        }
      }
    }
  }
  categories: RecipeAutomationCategory[]
  recent_runs: RecipeAutomationRunLog[]
  limits: {
    max_recipes_per_run: number
    timezone: 'America/Sao_Paulo'
  }
}

async function invokeRecipeAutomation(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke('recipe-automation-admin', {
    body,
  })

  if (error) throw error
  if (!data?.ok) {
    throw new Error(data?.error?.message || 'Falha na automação de receitas.')
  }

  return data
}

export function useRecipeAutomation() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['recipe-automation-admin'],
    queryFn: async () => {
      const data = await invokeRecipeAutomation({ action: 'get' })
      return data as RecipeAutomationState
    },
    refetchInterval: 30_000,
  })

  const saveMutation = useMutation({
    mutationFn: async (config: RecipeAutomationConfig) => {
      return invokeRecipeAutomation({
        action: 'save',
        config,
      })
    },
    onSuccess: () => {
      toast.success('Configuração da automação salva.')
      queryClient.invalidateQueries({ queryKey: ['recipe-automation-admin'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Não foi possível salvar a automação.')
    },
  })

  const runNowMutation = useMutation({
    mutationFn: async () => {
      return invokeRecipeAutomation({ action: 'run_now' })
    },
    onSuccess: (data) => {
      if (data?.result?.accepted === false) {
        toast.info('Já existe uma execução manual aguardando processamento.')
      } else {
        toast.success('Execução solicitada. O n8n iniciará no próximo ciclo.')
      }
      queryClient.invalidateQueries({ queryKey: ['recipe-automation-admin'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Não foi possível solicitar a execução.')
    },
  })

  return {
    ...query,
    saveMutation,
    runNowMutation,
  }
}
