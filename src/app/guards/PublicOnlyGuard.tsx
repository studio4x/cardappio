import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'
import { LoadingState } from '@/components/shared/LoadingState'

/**
 * Redirects authenticated users away from public-only pages
 * like login and signup. If logged in, go to /app.
 */
export function PublicOnlyGuard() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingState fullScreen message="Carregando..." />
  }

  if (isAuthenticated) {
    return <Navigate to="/app" replace />
  }

  return <Outlet />
}
