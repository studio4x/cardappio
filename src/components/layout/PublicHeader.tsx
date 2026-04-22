import { Link } from 'react-router-dom'
import { ChefHat, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { config } from '@/config'

const navLinks = [
  { label: 'Como funciona', href: '/como-funciona' },
  { label: 'Planos', href: '/planos' },
  { label: 'FAQ', href: '/faq' },
]

export function PublicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header
      className="sticky top-0 z-50 border-b backdrop-blur-md"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--color-surface-container-lowest) 90%, transparent)',
        borderColor: 'var(--color-outline-variant)',
      }}
    >
      <div className="container-app flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 no-underline">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            <ChefHat className="h-5 w-5 text-white" />
          </div>
          <span
            className="text-xl font-bold"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-on-surface)' }}
          >
            {config.app.name}
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="text-sm font-medium transition-colors hover:opacity-70"
              style={{ color: 'var(--color-on-surface-variant)' }}
            >
              {link.label}
            </Link>
          ))}
          <div className="flex items-center gap-3 ml-4">
            <Link
              to="/auth/login"
              className="text-sm font-medium transition-colors"
              style={{ color: 'var(--color-primary)' }}
            >
              Entrar
            </Link>
            <Link
              to="/auth/cadastro"
              className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              Criar conta
            </Link>
          </div>
        </nav>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 rounded-lg cursor-pointer"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Menu"
          style={{ color: 'var(--color-on-surface)' }}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div
          className="border-t px-5 pb-5 pt-3 md:hidden"
          style={{
            backgroundColor: 'var(--color-surface-container-lowest)',
            borderColor: 'var(--color-outline-variant)',
          }}
        >
          <nav className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
                style={{ color: 'var(--color-on-surface-variant)' }}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <hr style={{ borderColor: 'var(--color-outline-variant)' }} />
            <Link
              to="/auth/login"
              className="rounded-lg px-3 py-2.5 text-sm font-medium"
              style={{ color: 'var(--color-primary)' }}
              onClick={() => setMobileMenuOpen(false)}
            >
              Entrar
            </Link>
            <Link
              to="/auth/cadastro"
              className="rounded-lg px-4 py-2.5 text-center text-sm font-semibold text-white"
              style={{ backgroundColor: 'var(--color-primary)' }}
              onClick={() => setMobileMenuOpen(false)}
            >
              Criar conta grátis
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
