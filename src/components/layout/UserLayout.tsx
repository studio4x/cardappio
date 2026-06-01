import { Outlet, Link } from 'react-router-dom'
import { Bell, LogOut } from 'lucide-react'
import { useAuth } from '@/app/providers/AuthProvider'
import { Logo } from '@/components/shared/Logo'
import { MobileBottomNav } from './MobileBottomNav'
import { config } from '@/config'
import { useNotifications } from '@/hooks/notifications/useNotifications'

export function UserLayout() {
  const { user, signOut } = useAuth()
  const { data: notifications } = useNotifications()
  const unreadCount = notifications?.filter(n => !n.is_read).length || 0

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
          <Logo variant="dark" to="/app" />

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
              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm">
                  {unreadCount}
                </span>
              )}
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
      <main className="flex-1 pb-28 md:pb-12">
        <div className="container-app py-6">
          <Outlet />
          
          <div className="mt-12 mb-4 flex flex-col items-center gap-1 opacity-20">
            <span className="text-[10px] font-bold uppercase tracking-widest">
              Cardappio v{__BUILD_VERSION__}
            </span>
            <span className="text-[10px] font-mono">
              build #{__COMMIT_HASH__}
            </span>
          </div>
        </div>
      </main>

      {/* Mobile bottom nav */}
      <MobileBottomNav />
    </div>
  )
}
