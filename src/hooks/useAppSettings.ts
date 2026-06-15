import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useEffect } from 'react'

export interface VisualIdentity {
  logo_dark_url: string
  logo_light_url: string
  favicon_url: string
}

export function useAppSettings() {
  const { data: visualIdentity, isLoading: loading } = useQuery({
    queryKey: ['app_settings', 'visual_identity'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value_json')
        .eq('setting_key', 'visual_identity')
        .single()

      if (error) throw error
      
      return data?.value_json as unknown as VisualIdentity
    },
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  })

  useEffect(() => {
    if (visualIdentity?.favicon_url) {
      // 1. Favicon and Apple Touch Icon Link tags
      const links = document.querySelectorAll("link[rel*='icon'], link[rel='apple-touch-icon']")
      if (links.length > 0) {
        links.forEach((link) => {
          (link as HTMLLinkElement).href = visualIdentity.favicon_url
        })
      } else {
        const link = document.createElement('link')
        link.rel = 'icon'
        link.href = visualIdentity.favicon_url
        document.head.appendChild(link)
      }

      // 2. Startup/Splash Image for iOS
      const splashUrl = visualIdentity.logo_light_url || visualIdentity.favicon_url
      let splashLink = document.querySelector("link[rel='apple-touch-startup-image']") as HTMLLinkElement
      if (splashLink) {
        splashLink.href = splashUrl
      } else {
        splashLink = document.createElement('link')
        splashLink.rel = 'apple-touch-startup-image'
        splashLink.href = splashUrl
        document.head.appendChild(splashLink)
      }

      // 3. Dynamic manifest update (Blob URL fallback)
      const manifestEl = document.querySelector('link[rel="manifest"]') as HTMLLinkElement
      if (manifestEl) {
        const dynamicManifest = {
          name: 'Cardappio',
          short_name: 'Cardappio',
          description: 'Seu planejador semanal de refeições inteligente',
          lang: 'pt-BR',
          theme_color: '#f76f25',
          background_color: '#f8fafc',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          icons: [
            {
              src: visualIdentity.favicon_url,
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: visualIdentity.favicon_url,
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: visualIdentity.favicon_url,
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        }
        try {
          const blob = new Blob([JSON.stringify(dynamicManifest, null, 2)], { type: 'application/json' })
          manifestEl.href = URL.createObjectURL(blob)
        } catch (err) {
          console.warn('Failed to set dynamic manifest:', err)
        }
      }
    }
  }, [visualIdentity])

  return { visualIdentity: visualIdentity || null, loading }
}
