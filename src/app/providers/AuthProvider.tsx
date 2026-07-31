import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'
import type { Profile, UserPreferences, AuthState } from '@/types/auth'
import { toast } from 'sonner'
import { getTrialInfo } from '@/lib/subscription'

interface AuthContextValue extends AuthState {
  session: Session | null
  supabaseUser: User | null
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchProfile = useCallback(async (userId: string, isRecoverySession = false) => {
    try {
      // Timeout for profile fetch to avoid hanging the entire app if Supabase is blocked
      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('PROFILE_FETCH_TIMEOUT')), 5000)
      )

      // @ts-ignore
      const { data, error } = await Promise.race([profilePromise, timeoutPromise])

      if (error) {
        if (error.code === 'PGRST116') {
          if (isRecoverySession) {
            // During PASSWORD_RECOVERY, the user may not have a profile loaded yet.
            // Do NOT sign out — this would destroy the recovery session and prevent
            // the user from resetting their password.
            console.warn('Profile not found during recovery session — skipping signOut to preserve recovery flow.')
            return
          }

          // Profile not found: the trigger may have failed silently.
          // Attempt to auto-create the profile before giving up.
          console.warn('Perfil não encontrado (PGRST116). Tentando auto-criar profile via upsert...')
          try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
              console.error('Não foi possível obter dados do usuário para auto-criar o profile.')
              await supabase.auth.signOut()
              setSession(null)
              setSupabaseUser(null)
              setProfile(null)
              return
            }

            const fifteenDaysLater = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
            const { data: newProfile, error: upsertError } = await supabase
              .from('profiles')
              .upsert({
                id: user.id,
                email: user.email ?? '',
                full_name: (user.user_metadata?.full_name as string) ?? user.email?.split('@')[0] ?? '',
                role: 'user',
                status: 'active',
                subscription_tier: 'plano-pro-14-dias',
                subscription_until: fifteenDaysLater,
              }, { onConflict: 'id' })
              .select('*')
              .single()

            if (upsertError) {
              console.error('Falha ao auto-criar profile:', upsertError)
              await supabase.auth.signOut()
              setSession(null)
              setSupabaseUser(null)
              setProfile(null)
              return
            }

            // Also ensure user_preferences exist
            await supabase
              .from('user_preferences')
              .upsert({ user_id: user.id }, { onConflict: 'user_id' })

            console.info('Profile auto-criado com sucesso para o usuário:', user.id)
            setProfile(newProfile as Profile)
          } catch (autoCreateErr) {
            console.error('Erro inesperado ao auto-criar profile:', autoCreateErr)
            await supabase.auth.signOut()
            setSession(null)
            setSupabaseUser(null)
            setProfile(null)
          }
          return
        }
        console.error('Error fetching profile:', error)
        return
      }

      let fetchedProfile = data as Profile
      const trialInfo = getTrialInfo(fetchedProfile)
      if (trialInfo.isTrial && trialInfo.isExpired && fetchedProfile.subscription_tier !== 'plano-gratuito') {
        // Auto-downgrade expired trial to plano-gratuito
        fetchedProfile = {
          ...fetchedProfile,
          subscription_tier: 'plano-gratuito',
          subscription_until: null,
        }
        supabase
          .from('profiles')
          .update({ subscription_tier: 'plano-gratuito', subscription_until: null })
          .eq('id', userId)
          .then(({ error: downgradeError }) => {
            if (downgradeError) console.error('Error downgrading expired trial:', downgradeError)
          })
      }

      setProfile(fetchedProfile)
    } catch (err: any) {
      console.error('Error fetching profile:', err)
      if (err.message === 'PROFILE_FETCH_TIMEOUT') {
        console.warn('Profile fetch timed out, probably due to network/antivirus interference.')
      }
    }
  }, [])

  const fetchPreferences = useCallback(async (userId: string) => {
    try {
      const preferencesPromise = supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single()

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('PREFS_FETCH_TIMEOUT')), 5000)
      )

      // @ts-ignore
      const { data, error } = await Promise.race([preferencesPromise, timeoutPromise])

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows found (expected for new users)
        console.error('Error fetching preferences:', error)
        return
      }

      setPreferences(data as UserPreferences | null)
    } catch (err: any) {
      console.error('Error fetching preferences:', err)
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!supabaseUser) return
    await Promise.all([
      fetchProfile(supabaseUser.id),
      fetchPreferences(supabaseUser.id),
    ])
  }, [supabaseUser, fetchProfile, fetchPreferences])

  const signOut = useCallback(async () => {
    // 1. Clear local state immediately for instant feedback
    setSession(null)
    setSupabaseUser(null)
    setProfile(null)
    setPreferences(null)

    // 2. Clear flags
    try {
      sessionStorage.removeItem('isRecoveryFlow')
    } catch {}

    // 3. Show instant feedback toast
    toast.success('Sessão encerrada com sucesso!')

    // 4. Invalidate session on Supabase server in background
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.warn('Could not invalidate session on server, but cleared locally:', err)
    }
  }, [])

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting session:', error)
        setIsLoading(false)
        return
      }
      
      setSession(session)
      setSupabaseUser(session?.user ?? null)

      if (session?.user) {
        Promise.all([
          fetchProfile(session.user.id),
          fetchPreferences(session.user.id),
        ])
          .catch(err => console.error('Error fetching user data:', err))
          .finally(() => setIsLoading(false))
      } else {
        setIsLoading(false)
      }
    }).catch(err => {
      console.error('Unexpected error in getSession:', err)
      setIsLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const isRecoveryEvent = event === 'PASSWORD_RECOVERY'
        if (isRecoveryEvent) {
          sessionStorage.setItem('isRecoveryFlow', 'true')
        }
        setSession(session)
        setSupabaseUser(session?.user ?? null)

        try {
          if (session?.user) {
            await Promise.all([
              // Pass isRecoveryEvent so fetchProfile skips the destructive signOut
              // when the user has no profile (recovery sessions are temporary)
              fetchProfile(session.user.id, isRecoveryEvent),
              fetchPreferences(session.user.id),
            ])
          } else {
            setProfile(null)
            setPreferences(null)
          }
        } catch (err) {
          console.error('Error in auth state change:', err)
        } finally {
          setIsLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [fetchProfile, fetchPreferences])

  // Safety fallback: if Supabase hangs indefinitely due to browser extensions 
  // (e.g. Kaspersky) intercepting requests and swallowing promises, force load finish.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) {
        console.warn('Auth loading timeout exceeded. Forcing load to finish.')
        setIsLoading(false)
      }
    }, 10000)
    return () => clearTimeout(timer)
  }, [isLoading])

  const isAuthenticated = !!session && !!profile
  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin'
  const hasCompletedOnboarding = !!profile?.onboarding_completed_at

  const value: AuthContextValue = {
    session,
    supabaseUser,
    user: profile,
    preferences,
    isLoading,
    isAuthenticated,
    isAdmin,
    hasCompletedOnboarding,
    signOut,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
