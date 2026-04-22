import { Outlet } from 'react-router-dom'
import { PublicHeader } from './PublicHeader'
import { PublicFooter } from './PublicFooter'

/**
 * Layout for public/commercial pages:
 * Landing, Como funciona, Planos, FAQ, Contato, Quem somos, Suporte
 */
export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  )
}
