import { useAuth } from '@/app/providers/AuthProvider'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import type { Profile, UserPreferences } from '@/types/auth'

/**
 * Hook to access and manage the authenticated user's profile and preferences.
 */
export function useProfile() {
  const { user, preferences, isLoading, refreshProfile } = useAuth()

  return {
    profile: user,
    preferences,
    isLoading,
    refreshProfile,
    hasCompletedOnboarding: !!user?.onboarding_completed_at,
  }
}

/**
 * Mutation to update user profile (e.g., full name).
 */
export function useUpdateProfile() {
  const { refreshProfile } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (updates: Partial<Profile>) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Unauthorized')

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)

      if (error) throw error
    },
    onSuccess: () => {
      refreshProfile()
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      toast.success('Perfil atualizado com sucesso')
    },
    onError: (error) => {
      console.error('Error updating profile:', error)
      toast.error('Erro ao atualizar perfil')
    },
  })
}

/**
 * Mutation to update user preferences.
 */
export function useUpdatePreferences() {
  const { refreshProfile } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (updates: Partial<UserPreferences>) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Unauthorized')

      // Use upsert because preferences might not exist yet for very new users
      const { error } = await supabase
        .from('user_preferences')
        .upsert({ ...updates, user_id: user.id }, { onConflict: 'user_id' })

      if (error) throw error
    },
    onSuccess: () => {
      refreshProfile()
      queryClient.invalidateQueries({ queryKey: ['preferences'] })
      toast.success('Preferências salvas')
    },
    onError: (error) => {
      console.error('Error updating preferences:', error)
      toast.error('Erro ao salvar preferências')
    },
  })
}
