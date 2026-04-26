import { useState, useEffect } from 'react'
import { Outlet, NavLink, Link, useLocation } from 'react-router-dom'
import {
  ChefHat,
  LayoutDashboard,
  UtensilsCrossed,
  Layers,
  Tags,
  FolderOpen,
  Bell,
  Users,
  CreditCard,
  Settings,
  BarChart3,
  FileText,
  LogOut,
  Lightbulb,
  Menu,
  X
} from 'lucide-react'
import { useAuth } from '@/app/providers/AuthProvider'
import { cn } from '@/lib/utils'
import { config } from '@/config'

const adminNavGroups = [
  {
    label: 'Geral',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
    ],
  },
  {
    label: 'Conteúdo',
    items: [
      { label: 'Receitas', icon: UtensilsCrossed, href: '/admin/receitas' },
      { label: 'Categorias', icon: Layers, href: '/admin/categorias' },
      { label: 'Tags', icon: Tags, href: '/admin/tags' },
      { label: 'Coleções', icon: FolderOpen, href: '/admin/colecoes' },
      { label: 'Dicas e alertas', icon: Lightbulb, href: '/admin/dicas-alertas' },
    ],
  },
  {
    label: 'Operação',
    items: [
      { label: 'Notificações', icon: Bell, href: '/admin/notificacoes' },
      { label: 'Usuários', icon: Users, href: '/admin/usuarios' },
      { label: 'Planos', icon: CreditCard, href: '/admin/planos' },
      { label: 'Assinaturas', icon: CreditCard, href: '/admin/assinaturas' },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { label: 'Relatórios', icon: BarChart3, href: '/admin/relatorios' },
      { label: 'Logs', icon: FileText, href: '/admin/logs' },
      { label: 'Configurações', icon: Settings, href: '/admin/configuracoes' },
    ],
  },
]

/**
 * Layout for admin area (/admin/*).
 * Dense sidebar with modular navigation. Operational styling.
 */
export function AdminLayout() {
  const { signOut } = useAuth()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const location = useLocation()

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false)
  }, [location.pathname])

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: 'var(--color-surface)' }}>
      {/* Mobile Top Bar */}
      <div className="flex h-16 items-center justify-between border-b px-4 lg:hidden w-full fixed bg-surface z-40" style={{ borderColor: 'var(--color-outline-variant)' }}>
        <div className="flex items-center gap-2">
           <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: 'var(--color-primary)' }}>
             <ChefHat className="h-4 w-4 text-white" />
           </div>
           <span className="text-base font-bold text-on-surface">{config.app.name} Admin</span>
        </div>
        <button onClick={() => setIsMobileOpen(true)} className="p-2 border rounded-md" style={{ borderColor: 'var(--color-outline-variant)' }}>
           <Menu className="h-5 w-5 text-on-surface" />
        </button>
      </div>

      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-[60] bg-black/60 lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-[70] w-64 transform flex-col border-r transition-transform duration-300 lg:static lg:flex lg:translate-x-0 overflow-y-auto shadow-2xl lg:shadow-none",
          isMobileOpen ? "translate-x-0 flex" : "-translate-x-full"
        )}
        style={{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-outline-variant)',
        }}
      >
        {/* Logo */}
        <div className="flex h-14 items-center justify-between border-b px-5"
          style={{ borderColor: 'var(--color-outline-variant)' }}
        >
          <Link to="/admin" className="flex items-center gap-2 no-underline">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              <ChefHat className="h-4 w-4 text-white" />
            </div>
            <span
              className="text-base font-bold"
              style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-on-surface)' }}
            >
              {config.app.name}
            </span>
            <span
              className="ml-1 rounded-md px-1.5 py-0.5 text-xs font-semibold hidden sm:inline-block"
              style={{
                backgroundColor: 'var(--color-secondary-container)',
                color: 'var(--color-secondary-on-container)',
              }}
            >
              Admin
            </span>
          </Link>
          <button 
            className="lg:hidden p-1 rounded-md text-on-surface hover:bg-neutral-100"
            onClick={() => setIsMobileOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav groups */}
        <nav className="flex-1 space-y-5 px-3 py-4">
          {adminNavGroups.map((group) => (
            <div key={group.label}>
              <p
                className="mb-1.5 px-2 text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--color-outline)' }}
              >
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    end={item.href === '/admin'}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors no-underline',
                      )
                    }
                    style={({ isActive }) => ({
                      backgroundColor: isActive ? 'var(--color-surface-container)' : 'transparent',
                      color: isActive ? 'var(--color-primary)' : 'var(--color-on-surface-variant)',
                    })}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t px-3 py-3" style={{ borderColor: 'var(--color-outline-variant)' }}>
          <button
            onClick={signOut}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors cursor-pointer"
            style={{ color: 'var(--color-on-surface-variant)' }}
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0 pt-16 lg:pt-0">
        <main className="flex-1 p-4 md:p-8 lg:p-12 w-full max-w-[1600px] mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
