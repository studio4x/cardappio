import { useEffect } from 'react'

interface SEOProps {
  title: string
  description?: string
  canonical?: string
}

/**
 * SEO Component
 * 
 * Centralizes head tag updates for search engine optimization.
 * Recommended by Web application development guidelines.
 */
export function SEO({ title, description, canonical }: SEOProps) {
  const fullTitle = `${title} | Cardappio`
  const defaultDescription = "Simplifique sua vida na cozinha com o Cardappio. Planejador semanal inteligente, receitas testadas e listas de compras automáticas."

  useEffect(() => {
    document.title = fullTitle
    
    let metaDescription = document.querySelector('meta[name="description"]')
    if (!metaDescription) {
      metaDescription = document.createElement('meta')
      metaDescription.setAttribute('name', 'description')
      document.head.appendChild(metaDescription)
    }
    metaDescription.setAttribute('content', description || defaultDescription)

    if (canonical) {
      let linkCanonical = document.querySelector('link[rel="canonical"]')
      if (!linkCanonical) {
        linkCanonical = document.createElement('link')
        linkCanonical.setAttribute('rel', 'canonical')
        document.head.appendChild(linkCanonical)
      }
      linkCanonical.setAttribute('href', canonical)
    }
  }, [fullTitle, description, canonical, defaultDescription])

  return null
}
