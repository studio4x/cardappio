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
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement
      if (!link) {
        link = document.createElement('link')
        link.rel = 'icon'
        document.getElementsByTagName('head')[0].appendChild(link)
      }
      link.href = visualIdentity.favicon_url
    }
  }, [visualIdentity?.favicon_url])

  return { visualIdentity: visualIdentity || null, loading }
}
