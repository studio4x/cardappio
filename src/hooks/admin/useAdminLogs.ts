import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export interface AuditLog {
  id: string
  actor_user_id: string | null
  action: string
  entity_type: string
  entity_id: string | null
  metadata_json: any
  created_at: string
  profile?: {
    email: string
    full_name: string | null
  }
}

export function useAdminAuditLogs() {
  return useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          *,
          profile:profiles(email, full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error
      return data as unknown as AuditLog[]
    }
  })
}
