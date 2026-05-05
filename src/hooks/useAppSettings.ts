import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'

export interface VisualIdentity {
  logo_dark_url: string
  logo_light_url: string
  favicon_url: string
}

export function useAppSettings() {
  const [visualIdentity, setVisualIdentity] = useState<VisualIdentity | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSettings() {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('value_json')
          .eq('setting_key', 'visual_identity')
          .single()

        if (error) throw error

        if (data?.value_json) {
          const settings = data.value_json as unknown as VisualIdentity
          setVisualIdentity(settings)
          
          // Dynamically update favicon if present
          if (settings.favicon_url) {
            let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement
            if (!link) {
              link = document.createElement('link')
              link.rel = 'icon'
              document.getElementsByTagName('head')[0].appendChild(link)
            }
            link.href = settings.favicon_url
          }
        }
      } catch (err) {
        console.error('Error fetching app settings:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [])

  return { visualIdentity, loading }
}
