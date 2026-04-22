import { Outlet, Link } from 'react-router-dom'
import { ChefHat } from 'lucide-react'
import { config } from '@/config'

/**
 * Layout for auth pages: Login, Signup, Recover, Callback.
 * Clean, focused, minimal distraction.
 */
export function AuthLayout() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-5 py-10"
      style={{ backgroundColor: 'var(--color-surface)' }}
    >
      {/* Logo */}
      <Link to="/" className="mb-8 flex items-center gap-2.5 no-underline">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-xl"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          <ChefHat className="h-6 w-6 text-white" />
        </div>
        <span
          className="text-2xl font-bold"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-on-surface)' }}
        >
          {config.app.name}
        </span>
      </Link>

      {/* Auth content area */}
      <div
        className="w-full max-w-md rounded-2xl border p-8"
        style={{
          backgroundColor: 'var(--color-surface-container-lowest)',
          borderColor: 'var(--color-outline-variant)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <Outlet />
      </div>

      {/* Footer link */}
      <p
        className="mt-6 text-xs"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        © {new Date().getFullYear()} {config.app.name}
      </p>
    </div>
  )
}
