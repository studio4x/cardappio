import { NavLink } from 'react-router-dom'
import { Home, Calendar, ShoppingBasket, Utensils, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { label: 'Home', icon: Home, href: '/app' },
  { label: 'Planner', icon: Calendar, href: '/app/semana' },
  { label: 'Receitas', icon: Utensils, href: '/app/receitas' },
  { label: 'Compras', icon: ShoppingBasket, href: '/app/compras' },
  { label: 'Perfil', icon: User, href: '/app/perfil' },
]

export function MobileBottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t md:hidden"
      style={{
        backgroundColor: '#ffffff',
        borderColor: 'var(--color-outline-variant)',
        boxShadow: '0 -8px 30px rgba(0,0,0,0.06)',
      }}
    >
      {/* Safe area for notch phones */}
      <div
        className="flex items-center justify-around h-16"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.href === '/app'}
            className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full min-w-0 no-underline select-none"
          >
            {({ isActive }) => (
              <div
                className={cn(
                  'flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-2xl transition-all duration-200 active:scale-90',
                  isActive ? 'bg-orange-50' : ''
                )}
              >
                <item.icon
                  className={cn(
                    'transition-all duration-200',
                    isActive ? 'h-5 w-5' : 'h-5 w-5'
                  )}
                  strokeWidth={isActive ? 2.5 : 1.8}
                  style={{
                    color: isActive ? 'var(--color-primary)' : 'var(--color-outline)',
                    fill: isActive ? 'color-mix(in srgb, var(--color-primary) 15%, transparent)' : 'none',
                  }}
                />
                <span
                  className={cn(
                    'text-[10px] font-bold transition-all duration-200 leading-none',
                    isActive ? 'text-primary' : 'text-slate-400'
                  )}
                  style={{
                    color: isActive ? 'var(--color-primary)' : undefined,
                  }}
                >
                  {item.label}
                </span>
              </div>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
