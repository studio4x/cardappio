import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'
import { LoadingState } from '@/components/shared/LoadingState'

/**
 * Protects routes that require authentication.
 * Redirects to /auth/login if not authenticated.
 */
export function AuthGuard() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingState fullScreen message="Carregando..." />
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />
  }

  return <Outlet />
}
