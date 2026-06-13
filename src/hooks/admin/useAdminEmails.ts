import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export type EmailProvider = 'smtp' | 'brevo'

export interface EmailConfig {
  provider: EmailProvider
  // Brevo API
  brevo_api_key?: string
  // SMTP
  smtp_host?: string
  smtp_port?: number
  smtp_user?: string
  smtp_pass?: string
  // Shared (used by both providers)
  from_email: string
  from_name?: string
}

export interface EmailLog {
  id: string
  to_email: string
  subject: string
  body_html: string
  status: 'sent' | 'failed'
  provider: EmailProvider
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
          return { 
            provider: 'smtp' as EmailProvider,
            brevo_api_key: '',
            smtp_host: 'smtp-relay.brevo.com', 
            smtp_port: 587, 
            smtp_user: '', 
            smtp_pass: '', 
            from_email: 'contato@studio4x.com.br',
            from_name: 'Cardappio'
          } as EmailConfig
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

/**
 * Mutation to send a test email via the currently configured provider (SMTP or Brevo)
 */
export function useSendTestEmail() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: { toEmail: string; testSubject?: string; testBody?: string }) => {
      const { data, error } = await supabase.functions.invoke('admin-users', {
        body: {
          action: 'send_test_email',
          toEmail: params.toEmail,
          testSubject: params.testSubject,
          testBody: params.testBody
        }
      })

      if (error) throw error
      if (data?.error) throw new Error(data.error)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-logs'] })
    }
  })
}
