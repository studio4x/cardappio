import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'
import { LoadingState } from '@/components/shared/LoadingState'

/**
 * Protects admin routes by requiring admin or super_admin role.
 * Must be nested inside AuthGuard.
 */
export function AdminGuard() {
  const { isAdmin, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingState fullScreen message="Carregando..." />
  }

  if (!isAdmin) {
    return <Navigate to="/app" replace />
  }

  return <Outlet />
}
