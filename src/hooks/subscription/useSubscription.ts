import { useMutation, useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/app/providers/AuthProvider'
import { toast } from 'sonner'

export function useSubscription() {
  const { supabaseUser } = useAuth()

  const { data: subscription, isLoading } = useQuery({
    queryKey: ['user-subscription', supabaseUser?.id],
    queryFn: async () => {
      if (!supabaseUser) return null
      
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          plan:plans(*)
        `)
        .eq('user_id', supabaseUser.id)
        .eq('status', 'active')
        .maybeSingle()

      if (error) throw error
      return data
    },
    enabled: !!supabaseUser
  })

  const checkoutMutation = useMutation({
    mutationFn: async ({ planId, interval }: { planId: string, interval: 'month' | 'year' }) => {
      if (!supabaseUser) throw new Error('Not authenticated')

      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { 
          plan_id: planId,
          interval,
          success_url: `${window.location.origin}/app/perfil?checkout=success`,
          cancel_url: `${window.location.origin}/app/assinatura?checkout=cancel`
        }
      })

      if (error) throw error
      if (data.url) {
        window.location.href = data.url
      }
      return data
    },
    onError: (err: any) => {
      console.error('Checkout error:', err)
      toast.error('Erro ao iniciar checkout', {
        description: 'Tente novamente em alguns instantes.'
      })
    }
  })

  return { subscription, isLoading, checkoutMutation }
}
