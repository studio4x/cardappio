import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { PublicHeader } from './PublicHeader'
import { PublicFooter } from './PublicFooter'

/**
 * Layout for public/commercial pages:
 * Landing, Como funciona, Planos, FAQ, Contato, Quem somos, Suporte
 */
export function PublicLayout() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      // Small delay to ensure the DOM is fully rendered
      const timer = setTimeout(() => {
        try {
          const id = hash.replace('#', '')
          const element = document.getElementById(id)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' })
          }
        } catch (err) {
          console.warn('Failed to smooth scroll to element:', err)
        }
      }, 150)
      return () => clearTimeout(timer)
    } else {
      try {
        window.scrollTo(0, 0)
      } catch (err) {
        console.warn('Failed to scroll to top:', err)
      }
    }
  }, [pathname, hash])

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

