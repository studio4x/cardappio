import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export interface AdminUser {
  id: string
  email: string
  full_name: string | null
  role: 'user' | 'admin' | 'super_admin'
  status: 'active' | 'inactive' | 'suspended'
  onboarding_completed_at: string | null
  subscription_tier?: string
  subscription_until?: string | null
  created_at: string
}

export function useAdminUsers() {
  return useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('admin-users', {
        body: { action: 'list' }
      })
      
      if (error) {
        let errorMessage = error.message
        try {
          if ('context' in error && typeof (error as any).context.json === 'function') {
            const body = await (error as any).context.json()
            if (body && body.error) {
              errorMessage = body.error
            }
          }
        } catch (_) {}
        throw new Error(errorMessage)
      }
      
      return (data?.data?.users || []) as AdminUser[]
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
      
      if (error) {
        let errorMessage = error.message
        try {
          if ('context' in error && typeof (error as any).context.json === 'function') {
            const body = await (error as any).context.json()
            if (body && body.error) {
              errorMessage = body.error
            }
          }
        } catch (_) {}
        throw new Error(errorMessage)
      }
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
      
      if (error) {
        let errorMessage = error.message
        try {
          if ('context' in error && typeof (error as any).context.json === 'function') {
            const body = await (error as any).context.json()
            if (body && body.error) {
              errorMessage = body.error
            }
          }
        } catch (_) {}
        throw new Error(errorMessage)
      }
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
      
      if (error) {
        let errorMessage = error.message
        try {
          if ('context' in error && typeof (error as any).context.json === 'function') {
            const body = await (error as any).context.json()
            if (body && body.error) {
              errorMessage = body.error
            }
          }
        } catch (_) {}
        throw new Error(errorMessage)
      }
      if (data?.status === 'error') throw new Error(data.message)
      return data
    }
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      const { data, error } = await supabase.functions.invoke('admin-users', {
        body: { action: 'delete', userId }
      })

      if (error) {
        let errorMessage = error.message
        try {
          if ('context' in error && typeof (error as any).context.json === 'function') {
            const body = await (error as any).context.json()
            if (body && body.error) {
              errorMessage = body.error
            }
          }
        } catch (_) {}
        throw new Error(errorMessage)
      }
      if (data?.status === 'error') throw new Error(data.message)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    }
  })
}

export function useSendPasswordResetLink() {
  return useMutation({
    mutationFn: async ({ email }: { email: string }) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback`
      })
      if (error) throw error
    }
  })
}

export function useUpdateUserPlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, planTier }: { userId: string; planTier: string }) => {
      const { data, error } = await supabase.functions.invoke('admin-users', {
        body: { action: 'update_plan', userId, planTier }
      })

      if (error) {
        let errorMessage = error.message
        try {
          if ('context' in error && typeof (error as any).context.json === 'function') {
            const body = await (error as any).context.json()
            if (body && body.error) {
              errorMessage = body.error
            }
          }
        } catch (_) {}
        throw new Error(errorMessage)
      }
      if (data?.status === 'error') throw new Error(data.message)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    }
  })
}


