import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export interface RecipeCoverFilters {
  automation_only: boolean
  category_slug: string
  status: string
}

export interface RecipeCoverQueueSummary {
  request_id: string
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'skipped'
  attempt_count: number
  updated_at: string
  last_error_code?: string | null
  last_error_message?: string | null
}

export interface RecipeWithoutCover {
  id: string
  title: string
  status: string
  created_at: string
  is_automation_created: boolean
  category_name: string
  category_slug: string
  cover_request?: RecipeCoverQueueSummary | null
}

async function invokeCoverAdmin(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke('recipe-automation-admin', { body })
  if (error) throw error
  if (!data?.ok) throw new Error(data?.error?.message || 'Falha ao controlar capas de receitas.')
  return data
}

export function useRecipeCoverAutomation(filters: RecipeCoverFilters) {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: ['recipe-cover-missing', filters],
    queryFn: async () => {
      const data = await invokeCoverAdmin({ action: 'list_missing_covers', ...filters })
      return {
        recipes: (data?.recipes || []) as RecipeWithoutCover[],
        total: Number(data?.total || 0),
      }
    },
    refetchInterval: 20_000,
  })

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ['recipe-cover-missing'] })
    queryClient.invalidateQueries({ queryKey: ['recipe-automation-admin'] })
  }

  const requestOneMutation = useMutation({
    mutationFn: async (recipeId: string) => invokeCoverAdmin({
      action: 'request_cover_generation',
      recipe_id: recipeId,
      force_regenerate: false,
    }),
    onSuccess: (data) => {
      if (data?.result?.accepted === false) {
        toast.info(data?.result?.reason === 'already_queued'
          ? 'Essa receita já está na fila de geração de capa.'
          : 'A receita já possui uma capa.')
      } else {
        toast.success('Geração da capa adicionada à fila.')
      }
      refreshAll()
    },
    onError: (error: Error) => toast.error(error.message || 'Não foi possível solicitar a capa.'),
  })

  const requestBatchMutation = useMutation({
    mutationFn: async (recipeIds: string[]) => invokeCoverAdmin({
      action: 'request_cover_generation_batch',
      recipe_ids: recipeIds,
    }),
    onSuccess: (data) => {
      const accepted = Number(data?.result?.accepted || 0)
      const requested = Number(data?.result?.requested || 0)
      toast.success(`${accepted} de ${requested} receita${requested === 1 ? '' : 's'} adicionada${accepted === 1 ? '' : 's'} à fila.`)
      refreshAll()
    },
    onError: (error: Error) => toast.error(error.message || 'Não foi possível solicitar as capas.'),
  })

  return {
    ...query,
    requestOneMutation,
    requestBatchMutation,
  }
}
