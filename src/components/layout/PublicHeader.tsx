import { Link } from 'react-router-dom'
import { Utensils, Menu, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { config } from '@/config'

const navLinks = [
  { label: 'Como funciona', href: '#como-funciona' },
  { label: 'Benefícios', href: '#beneficios' },
]

export function PublicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white/80 backdrop-blur-xl h-20 border-b border-neutral-100 shadow-sm' : 'bg-transparent h-24'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 no-underline group active:scale-95 transition-transform">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:rotate-6 transition-transform">
            <Utensils className="text-white h-6 w-6" />
          </div>
          <span className="text-2xl font-black tracking-tighter text-on-surface">
            {config.app.name}
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-10 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-bold text-on-surface/70 hover:text-primary transition-colors no-underline"
            >
              {link.label}
            </a>
          ))}
          <div className="flex items-center gap-6 ml-4">
            <Link
              to="/auth/login"
              className="text-sm font-bold text-on-surface/70 hover:text-primary transition-colors no-underline"
            >
              Entrar
            </Link>
            <Link
              to="/auth/cadastro"
              className="bg-primary text-white px-6 py-3 rounded-full font-bold text-sm shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all no-underline"
            >
              Criar conta grátis
            </Link>
          </div>
        </nav>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 rounded-xl bg-neutral-100/50 cursor-pointer"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-white border-b border-neutral-100 p-6 md:hidden animate-in fade-in slide-in-from-top-4 duration-300">
          <nav className="flex flex-col gap-6">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-lg font-bold text-on-surface/70 no-underline"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="pt-6 border-t border-neutral-50 flex flex-col gap-4">
              <Link
                to="/auth/login"
                className="text-lg font-bold text-on-surface/70 no-underline"
                onClick={() => setMobileMenuOpen(false)}
              >
                Entrar
              </Link>
              <Link
                to="/auth/cadastro"
                className="bg-primary text-white px-6 py-4 rounded-2xl text-center font-bold text-lg shadow-xl shadow-primary/20 no-underline"
                onClick={() => setMobileMenuOpen(false)}
              >
                Criar conta grátis
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
