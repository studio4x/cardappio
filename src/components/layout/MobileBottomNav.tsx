import { NavLink } from 'react-router-dom'
import { Home, CalendarDays, ShoppingCart, Heart, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { label: 'Início', icon: Home, href: '/app' },
  { label: 'Semana', icon: CalendarDays, href: '/app/semana' },
  { label: 'Compras', icon: ShoppingCart, href: '/app/compras' },
  { label: 'Favoritos', icon: Heart, href: '/app/favoritos' },
  { label: 'Perfil', icon: User, href: '/app/perfil' },
]

export function MobileBottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t md:hidden"
      style={{
        backgroundColor: 'var(--color-surface-container-lowest)',
        borderColor: 'var(--color-outline-variant)',
      }}
    >
      {/* Safe area for notch phones */}
      <div className="flex items-center justify-around pb-[env(safe-area-inset-bottom)] h-16">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.href === '/app'}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-0.5 px-3 py-2 text-xs font-medium transition-colors no-underline',
              )
            }
            style={({ isActive }) => ({
              color: isActive ? 'var(--color-primary)' : 'var(--color-outline)',
            })}
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn('h-5 w-5', isActive && 'fill-current')} strokeWidth={isActive ? 2.5 : 2} />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
