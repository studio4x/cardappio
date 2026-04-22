import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export interface AdminPlan {
  id: string
  name: string
  slug: string
  price_monthly: number
  price_yearly: number
  is_active: boolean
  features: string[]
  stripe_price_id_monthly: string | null
  stripe_price_id_yearly: string | null
}

export function useAdminPlans() {
  return useQuery({
    queryKey: ['admin-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price_monthly', { ascending: true })
      
      if (error) throw error
      return data as AdminPlan[]
    }
  })
}

export function useUpdatePlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (plan: Partial<AdminPlan> & { id: string }) => {
      const { error } = await supabase
        .from('subscription_plans')
        .update(plan)
        .eq('id', plan.id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-plans'] })
    }
  })
}
