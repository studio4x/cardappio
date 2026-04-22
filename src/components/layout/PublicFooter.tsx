import { Link } from 'react-router-dom'
import { ChefHat } from 'lucide-react'
import { config } from '@/config'

export function PublicFooter() {
  return (
    <footer
      className="border-t py-12"
      style={{
        backgroundColor: 'var(--color-surface-container)',
        borderColor: 'var(--color-outline-variant)',
      }}
    >
      <div className="container-app">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 no-underline">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                <ChefHat className="h-4 w-4 text-white" />
              </div>
              <span
                className="text-lg font-bold"
                style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-on-surface)' }}
              >
                {config.app.name}
              </span>
            </Link>
            <p
              className="mt-3 text-sm leading-relaxed"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {config.app.tagline}
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="mb-3 text-sm font-semibold" style={{ color: 'var(--color-on-surface)' }}>
              Produto
            </h4>
            <nav className="flex flex-col gap-2">
              <Link to="/como-funciona" className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Como funciona
              </Link>
              <Link to="/planos" className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Planos
              </Link>
              <Link to="/faq" className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                FAQ
              </Link>
            </nav>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold" style={{ color: 'var(--color-on-surface)' }}>
              Institucional
            </h4>
            <nav className="flex flex-col gap-2">
              <Link to="/quem-somos" className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Quem somos
              </Link>
              <Link to="/contato" className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Contato
              </Link>
              <Link to="/suporte" className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Suporte
              </Link>
            </nav>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold" style={{ color: 'var(--color-on-surface)' }}>
              Conta
            </h4>
            <nav className="flex flex-col gap-2">
              <Link to="/auth/login" className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Entrar
              </Link>
              <Link to="/auth/cadastro" className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Criar conta
              </Link>
            </nav>
          </div>
        </div>

        <div
          className="mt-10 border-t pt-6 text-center text-xs"
          style={{
            borderColor: 'var(--color-outline-variant)',
            color: 'var(--color-text-secondary)',
          }}
        >
          © {new Date().getFullYear()} {config.app.name}. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  )
}
