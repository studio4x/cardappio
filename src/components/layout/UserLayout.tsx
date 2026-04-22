import { Outlet, Link } from 'react-router-dom'
import { ChefHat, Bell, LogOut } from 'lucide-react'
import { useAuth } from '@/app/providers/AuthProvider'
import { MobileBottomNav } from './MobileBottomNav'
import { config } from '@/config'

/**
 * Layout for authenticated user area (/app/*).
 * Mobile-first with bottom nav, contextual header, optional desktop sidebar.
 */
export function UserLayout() {
  const { user, signOut } = useAuth()

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ backgroundColor: 'var(--color-surface)' }}
    >
      {/* Top header */}
      <header
        className="sticky top-0 z-40 border-b"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--color-surface-container-lowest) 95%, transparent)',
          backdropFilter: 'blur(12px)',
          borderColor: 'var(--color-outline-variant)',
        }}
      >
        <div className="container-app flex h-14 items-center justify-between">
          <Link to="/app" className="flex items-center gap-2 no-underline">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              <ChefHat className="h-4 w-4 text-white" />
            </div>
            <span
              className="text-lg font-bold hidden sm:inline"
              style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-on-surface)' }}
            >
              {config.app.name}
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              to="/app/notificacoes"
              className="relative rounded-lg p-2 transition-colors hover:opacity-70"
              style={{ color: 'var(--color-on-surface-variant)' }}
              aria-label="Notificações"
            >
              <Bell className="h-5 w-5" />
            </Link>
            {user && (
              <div className="flex items-center gap-2 ml-1">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold"
                  style={{
                    backgroundColor: 'var(--color-primary-container)',
                    color: 'var(--color-primary-on-container)',
                  }}
                >
                  {user.full_name?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase()}
                </div>
                <button
                  onClick={signOut}
                  className="hidden rounded-lg p-2 transition-colors hover:opacity-70 cursor-pointer sm:block"
                  style={{ color: 'var(--color-on-surface-variant)' }}
                  title="Sair"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 pb-20 md:pb-6">
        <div className="container-app py-6">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom nav */}
      <MobileBottomNav />
    </div>
  )
}
