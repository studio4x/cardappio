import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export interface Notification {
  id: string
  user_id: string
  title: string
  body: string
  type: 'meal_reminder' | 'system' | 'promotion' | 'subscription'
  action_url: string | null
  is_read: boolean
  read_at: string | null
  created_at: string
}

/**
 * Fetch user's notifications.
 */
export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Notification[]
    },
  })
}

/**
 * Mark a single notification as read.
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

/**
 * Mark all user notifications as read.
 */
export function useMarkAllAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('is_read', false)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}
