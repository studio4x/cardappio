import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export interface AdminSubscription {
  id: string
  user_id: string
  plan_id: string
  status: 'active' | 'past_due' | 'canceled' | 'trialing' | 'incomplete'
  tier: 'free' | 'premium' | 'gold' | 'plano-7-refeicoes' | 'plano-14-refeicoes'
  billing_cycle: 'monthly' | 'yearly' | 'lifetime'
  current_period_end: string | null
  cancel_at_period_end: boolean
  created_at: string
  updated_at: string
  profile: {
    id: string
    email: string
    full_name: string | null
  }
  plan: {
    id: string
    name: string
    price_monthly: number
  }
}

export function useAdminSubscriptions() {
  return useQuery({
    queryKey: ['admin-subscriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          profile:profiles(id, email, full_name),
          plan:subscription_plans(id, name, price_monthly)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as unknown as AdminSubscription[]
    }
  })
}

export function useUpdateSubscription() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (sub: Partial<AdminSubscription> & { id: string }) => {
      const { error } = await supabase
        .from('user_subscriptions')
        .update(sub)
        .eq('id', sub.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] })
    }
  })
}
