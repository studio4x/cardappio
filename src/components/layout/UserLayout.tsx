import { Outlet, Link } from 'react-router-dom'
import { ChefHat, Bell, LogOut, Utensils } from 'lucide-react'
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
        <div className="container-app flex h-16 items-center justify-between">
          <Link to="/app" className="flex items-center gap-2 no-underline group active:scale-95 transition-transform duration-200">
            <Utensils className="h-6 w-6" style={{ color: 'var(--color-primary)' }} />
            <span
              className="text-xl font-extrabold tracking-tighter"
              style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-primary)' }}
            >
              Cardappio
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex gap-6 mr-6">
              <Link to="/app" className="text-sm font-bold no-underline" style={{ color: 'var(--color-primary)' }}>Home</Link>
              <Link to="/app/semana" className="text-sm font-medium no-underline hover:text-primary transition-colors" style={{ color: 'var(--color-text-secondary)' }}>Planner</Link>
              <Link to="/app/receitas" className="text-sm font-medium no-underline hover:text-primary transition-colors" style={{ color: 'var(--color-text-secondary)' }}>Receitas</Link>
            </div>

            <Link
              to="/app/notificacoes"
              className="relative rounded-full p-2.5 transition-colors hover:bg-neutral-100"
              style={{ color: 'var(--color-on-surface-variant)' }}
              aria-label="Notificações"
            >
              <Bell className="h-5 w-5" />
            </Link>

            {user && (
              <Link to="/app/perfil" className="flex items-center gap-2 ml-1 no-underline active:scale-95 transition-transform">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full border shadow-sm overflow-hidden"
                  style={{
                    backgroundColor: 'var(--color-surface-container-highest)',
                    borderColor: 'var(--color-outline-variant)',
                  }}
                >
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold" style={{ color: 'var(--color-on-surface-variant)' }}>
                      {user.full_name?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              </Link>
            )}
            
            <button
              onClick={signOut}
              className="ml-2 rounded-full p-2.5 transition-colors hover:bg-red-50 cursor-pointer text-red-500"
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </button>
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
