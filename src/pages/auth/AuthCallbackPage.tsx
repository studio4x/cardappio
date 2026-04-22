import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { LoadingState } from '@/components/shared/LoadingState'

/**
 * AuthCallbackPage
 *
 * Handles the redirect after:
 * - Magic link login
 * - Email confirmation
 * - Password reset
 *
 * Supabase automatically exchanges the URL tokens for a session.
 * This page waits for that to complete, then redirects.
 *
 * Per ROUTES_AND_PAGES.md:
 * Route: /auth/callback
 * Objetivo: processar tokens do callback e redirecionar ao app.
 */
export function AuthCallbackPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const handleCallback = async () => {
      // Supabase client auto-detects tokens in the URL hash
      // and exchanges them for a session via detectSessionInUrl: true
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error) {
        console.error('Auth callback error:', error)
        navigate('/auth/login', { replace: true })
        return
      }

      if (session) {
        // Check if user has completed onboarding
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completed_at')
          .eq('id', session.user.id)
          .single()

        if (profile?.onboarding_completed_at) {
          navigate('/app', { replace: true })
        } else {
          navigate('/app/onboarding', { replace: true })
        }
      } else {
        // No session — redirect to login
        navigate('/auth/login', { replace: true })
      }
    }

    // Small delay to let Supabase process the URL tokens
    const timeout = setTimeout(handleCallback, 500)
    return () => clearTimeout(timeout)
  }, [navigate])

  return (
    <LoadingState fullScreen message="Processando autenticação..." />
  )
}
