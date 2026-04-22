import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'
import { LoadingState } from '@/components/shared/LoadingState'

/**
 * Redirects users who haven't completed onboarding.
 * Must be nested inside AuthGuard.
 */
export function OnboardingGuard() {
  const { hasCompletedOnboarding, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingState fullScreen message="Carregando..." />
  }

  if (!hasCompletedOnboarding) {
    return <Navigate to="/app/onboarding" replace />
  }

  return <Outlet />
}
