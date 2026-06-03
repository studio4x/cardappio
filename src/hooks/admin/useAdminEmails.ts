import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export interface EmailConfig {
  provider: string
  resend_api_key: string
  from_email: string
}

export interface EmailLog {
  id: string
  to_email: string
  subject: string
  body_html: string
  status: 'sent' | 'failed'
  error_message: string | null
  created_at: string
}

/**
 * Fetches transactional email configuration from app_settings
 */
export function useEmailConfig() {
  return useQuery({
    queryKey: ['email-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value_json')
        .eq('setting_key', 'email_config')
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return { provider: 'resend', resend_api_key: '', from_email: 'Cardappio <onboarding@resend.dev>' } as EmailConfig
        }
        throw error
      }
      return data.value_json as unknown as EmailConfig
    }
  })
}

/**
 * Mutation to update the email configuration in app_settings
 */
export function useUpdateEmailConfig() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (newConfig: EmailConfig) => {
      const { error } = await supabase
        .from('app_settings')
        .update({
          value_json: newConfig as any,
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', 'email_config')

      if (error) throw error
      return newConfig
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-config'] })
    }
  })
}

/**
 * Fetches all transactional email logs from email_logs table
 */
export function useEmailLogs() {
  return useQuery({
    queryKey: ['email-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_logs')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as EmailLog[]
    }
  })
}
