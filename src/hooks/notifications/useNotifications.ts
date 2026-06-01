import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'


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

export interface NotificationPreferences {
  meal_reminders: boolean
  daily_summary: boolean
  marketing_alerts: boolean
  system_updates: boolean
  push_enabled: boolean
  push_token: string | null
}

/**
 * Fetch user's notification preferences.
 */
export function useNotificationPreferences() {
  return useQuery({
    queryKey: ['notification-preferences'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) throw error

      // Default values if not set yet
      if (!data) {
        return {
          meal_reminders: true,
          daily_summary: false,
          marketing_alerts: true,
          system_updates: true,
          push_enabled: false,
          push_token: null,
        } as NotificationPreferences
      }

      return data as NotificationPreferences
    },
  })
}

/**
 * Update user's notification preferences.
 */
export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (updates: Partial<NotificationPreferences>) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          ...updates,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] })
      toast.success('Preferências de notificação salvas!')
    },
    onError: (err: any) => {
      console.error('Error updating notification preferences:', err)
      toast.error('Erro ao salvar preferências de notificação')
    }
  })
}
