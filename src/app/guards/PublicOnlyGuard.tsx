import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'
import { LoadingState } from '@/components/shared/LoadingState'

/**
 * Redirects authenticated users away from public-only pages
 * like login and signup. If logged in, go to /app.
 */
export function PublicOnlyGuard() {
  const { isAuthenticated, isAdmin, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <LoadingState fullScreen message="Carregando..." />
  }

  if (isAuthenticated) {
    // Permite que o usuário acesse a página de redefinição de senha mesmo estando autenticado em sessão de recuperação
    const searchParams = new URLSearchParams(location.search)
    const isResetPage = location.pathname === '/auth/recuperar' && (
      searchParams.get('reset') === 'true' || 
      sessionStorage.getItem('isRecoveryFlow') === 'true'
    )

    if (isResetPage) {
      return <Outlet />
    }

    if (isAdmin) {
      return <Navigate to="/admin" replace />
    }
    return <Navigate to="/app" replace />
  }

  return <Outlet />
}
