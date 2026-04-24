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

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        return
      }

      setProfile(data as Profile)
    } catch (err) {
      console.error('Error fetching profile:', err)
    }
  }, [])

  const fetchPreferences = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows found (expected for new users)
        console.error('Error fetching preferences:', error)
        return
      }

      setPreferences(data as UserPreferences | null)
    } catch (err) {
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
    await supabase.auth.signOut()
    setSession(null)
    setSupabaseUser(null)
    setProfile(null)
    setPreferences(null)
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
      async (_event, session) => {
        setSession(session)
        setSupabaseUser(session?.user ?? null)

        try {
          if (session?.user) {
            await Promise.all([
              fetchProfile(session.user.id),
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
