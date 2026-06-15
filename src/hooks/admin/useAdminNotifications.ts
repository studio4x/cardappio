import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export interface QueueItem {
  id: string
  user_id: string
  title: string
  body: string
  type: string
  payload_json: { action_url?: string } | null
  scheduled_for: string
  status: 'pending' | 'processing' | 'sent' | 'failed'
  attempts: number
  last_error: string | null
  created_at: string
  profile?: {
    email: string
    full_name: string | null
  }
}

export interface DeliveryLog {
  id: string
  notification_id: string | null
  user_id: string | null
  channel: 'in_app' | 'push' | 'email' | 'sms'
  status: string
  error_message: string | null
  metadata: any
  delivered_at: string
  profile?: {
    email: string
    full_name: string | null
  }
}

export interface CronLog {
  id: string
  job_name: string
  status: string
  processed_count: number
  metadata_json: any
  created_at: string
}

export function useAdminNotificationQueue() {
  return useQuery({
    queryKey: ['admin-notification-queue'],
    queryFn: async () => {
      // Fetch queue items along with user profiles
      const { data, error } = await supabase
        .from('notification_queue')
        .select(`
          *,
          profile:profiles(email, full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error
      return data as unknown as QueueItem[]
    }
  })
}

export function useAdminDeliveryLogs() {
  return useQuery({
    queryKey: ['admin-notification-delivery-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notification_delivery_logs')
        .select(`
          *,
          profile:profiles(email, full_name)
        `)
        .order('delivered_at', { ascending: false })
        .limit(100)

      if (error) throw error
      return data as unknown as DeliveryLog[]
    }
  })
}

export function useAdminCronLogs() {
  return useQuery({
    queryKey: ['admin-cron-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cron_execution_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      return data as CronLog[]
    }
  })
}

export function useSendManualNotification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      title,
      body,
      type,
      target,
      specificUserId,
      actionUrl,
      imageUrl
    }: {
      title: string
      body: string
      type: string
      target: 'all' | 'subscribers' | 'specific'
      specificUserId?: string
      actionUrl?: string
      imageUrl?: string
    }) => {
      // 1. Fetch target user IDs
      let userIds: string[] = []

      if (target === 'specific') {
        if (!specificUserId) throw new Error("Usuário não selecionado")
        userIds = [specificUserId]
      } else if (target === 'subscribers') {
        const { data: subs, error: subsErr } = await supabase
          .from('user_subscriptions')
          .select('user_id')
          .in('status', ['active', 'trialing'])
        
        if (subsErr) throw subsErr
        userIds = subs.map(s => s.user_id)
      } else {
        // all users
        const { data: profiles, error: profErr } = await supabase
          .from('profiles')
          .select('id')
          .eq('role', 'user')
        
        if (profErr) throw profErr
        userIds = profiles.map(p => p.id)
      }

      if (userIds.length === 0) {
        throw new Error("Nenhum usuário correspondente encontrado para o filtro selecionado.")
      }

      // 2. Insert into notification_queue
      const payload_json: any = {}
      if (actionUrl) payload_json.action_url = actionUrl
      if (imageUrl) payload_json.image_url = imageUrl

      const queueRows = userIds.map(userId => ({
        user_id: userId,
        title,
        body,
        type,
        payload_json,
        status: 'pending'
      }))

      // Batch insert into queue (Supabase handles batching automatically)
      const { error: insertErr } = await supabase
        .from('notification_queue')
        .insert(queueRows)

      if (insertErr) throw insertErr

      // 3. Immediately trigger dispatch-notifications edge function
      const { data, error: functionErr } = await supabase.functions.invoke('dispatch-notifications')
      
      if (functionErr) {
        console.warn("Notification queued but instant dispatch failed. It will process via cron.", functionErr)
      }

      return { count: userIds.length, dispatchResult: data }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notification-queue'] })
      queryClient.invalidateQueries({ queryKey: ['admin-notification-delivery-logs'] })
    }
  })
}

export function useTriggerNotificationDispatch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('dispatch-notifications')
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notification-queue'] })
      queryClient.invalidateQueries({ queryKey: ['admin-notification-delivery-logs'] })
      queryClient.invalidateQueries({ queryKey: ['admin-cron-logs'] })
    }
  })
}

export function useCancelQueueItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notification_queue')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notification-queue'] })
    }
  })
}
