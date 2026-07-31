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
      try {
        const searchParams = new URLSearchParams(window.location.search)
        const code = searchParams.get('code')

        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          if (exchangeError) {
            console.error('Error exchanging code for session:', exchangeError)
            navigate('/auth/login', { replace: true })
            return
          }
        }

        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Auth callback error:', error)
          navigate('/auth/login', { replace: true })
          return
        }

        if (session) {
          // Check if this is a password recovery flow
          const hashParams = new URLSearchParams(window.location.hash.substring(1))
          const isRecovery = hashParams.get('type') === 'recovery' || 
                             searchParams.get('type') === 'recovery' || 
                             window.location.href.includes('type=recovery') ||
                             sessionStorage.getItem('isRecoveryFlow') === 'true'

          if (isRecovery) {
            sessionStorage.setItem('isRecoveryFlow', 'true')
            navigate('/auth/recuperar?reset=true', { replace: true })
            return
          }

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
      } catch (err) {
        console.error('Unexpected error in handleCallback:', err)
        navigate('/auth/login', { replace: true })
      }
    }

    handleCallback()
  }, [navigate])

  return (
    <LoadingState fullScreen message="Processando autenticação..." />
  )
}
