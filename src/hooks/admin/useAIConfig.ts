import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export interface AIConfig {
  openai_api_key: string
  gemini_api_key: string
  preferred_provider: 'openai' | 'gemini'
}

import { type NutritionInfo } from '@/domains/recipes/types'

export type NutritionResult = NutritionInfo & {
  provider: string
}

const DEFAULT_CONFIG: AIConfig = {
  openai_api_key: '',
  gemini_api_key: '',
  preferred_provider: 'openai'
}

/**
 * Reads the AI provider configuration from app_settings.
 * The actual API keys are only accessible to admin-role users (RLS enforced).
 * For security, keys are masked in the UI after save.
 */
export function useAIConfig() {
  return useQuery({
    queryKey: ['ai-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value_json')
        .eq('setting_key', 'ai_config')
        .single()

      if (error) {
        if (error.code === 'PGRST116') return DEFAULT_CONFIG
        throw error
      }

      return (data?.value_json as unknown as AIConfig) ?? DEFAULT_CONFIG
    }
  })
}

/**
 * Saves the AI configuration (API keys + preferred provider) to app_settings.
 */
export function useUpdateAIConfig() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (config: AIConfig) => {
      const { error } = await supabase
        .from('app_settings')
        .update({
          value_json: config as any,
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', 'ai_config')

      if (error) throw error
      return config
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-config'] })
      toast.success('Configurações de IA salvas com sucesso!')
    },
    onError: (err: any) => {
      console.error('Error saving AI config:', err)
      toast.error('Erro ao salvar configurações de IA')
    }
  })
}

/**
 * Calls the generate-nutrition Edge Function to produce nutritional values
 * from the recipe's ingredient list.
 */
export function useGenerateNutrition() {
  return useMutation({
    mutationFn: async ({
      ingredients,
      servings
    }: {
      ingredients: { name: string; quantity_label: string | null; unit: string | null }[]
      servings: number
    }): Promise<NutritionResult> => {
      const { data, error } = await supabase.functions.invoke('generate-nutrition', {
        body: { ingredients, servings }
      })

      if (error) throw error
      if (data?.error) throw new Error(data.error.message || 'Erro na geração nutricional')

      return data.data as NutritionResult
    },
    onError: (err: any) => {
      console.error('Nutrition generation error:', err)
      toast.error(err.message || 'Erro ao gerar tabela nutricional')
    }
  })
}
