import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export interface AdminUser {
  id: string
  email: string
  full_name: string | null
  role: 'user' | 'admin' | 'super_admin'
  status: 'active' | 'inactive' | 'suspended'
  onboarding_completed_at: string | null
  created_at: string
}

export function useAdminUsers() {
  return useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as AdminUser[]
    }
  })
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string, role: AdminUser['role'] }) => {
      const { data, error } = await supabase.functions.invoke('admin-users', {
        body: { action: 'update_role', userId, role }
      })
      
      if (error) throw error
      if (data?.status === 'error') throw new Error(data.message)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    }
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userData: { email: string; password: string; fullName: string; role: string }) => {
      const { data, error } = await supabase.functions.invoke('admin-users', {
        body: { action: 'create', ...userData }
      })
      
      if (error) throw error
      if (data?.status === 'error') throw new Error(data.message)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    }
  })
}

export function useResetUserPassword() {
  return useMutation({
    mutationFn: async ({ userId, newPassword }: { userId: string; newPassword: string }) => {
      const { data, error } = await supabase.functions.invoke('admin-users', {
        body: { action: 'reset_password', userId, newPassword }
      })
      
      if (error) throw error
      if (data?.status === 'error') throw new Error(data.message)
      return data
    }
  })
}
