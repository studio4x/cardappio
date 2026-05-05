import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export interface VisualIdentity {
  logo_dark_url: string
  logo_light_url: string
  favicon_url: string
}

export function useAdminSettings() {
  const [loading, setLoading] = useState(true)
  const [visualIdentity, setVisualIdentity] = useState<VisualIdentity>({
    logo_dark_url: '',
    logo_light_url: '',
    favicon_url: ''
  })

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('app_settings')
        .select('value_json')
        .eq('setting_key', 'visual_identity')
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // Setting doesn't exist, migration might not have run or was conflict
          return
        }
        throw error
      }

      if (data?.value_json) {
        setVisualIdentity(data.value_json as unknown as VisualIdentity)
      }
    } catch (err) {
      console.error('Error fetching settings:', err)
      toast.error('Erro ao carregar configurações')
    } finally {
      setLoading(false)
    }
  }

  const updateVisualIdentity = async (newData: VisualIdentity) => {
    try {
      const { error } = await supabase
        .from('app_settings')
        .update({ 
          value_json: newData as any,
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', 'visual_identity')

      if (error) throw error
      
      setVisualIdentity(newData)
      toast.success('Identidade visual atualizada!')
      return true
    } catch (err) {
      console.error('Error updating settings:', err)
      toast.error('Erro ao salvar configurações')
      return false
    }
  }

  const uploadAsset = async (file: File, path: string) => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${path}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `brand/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('system')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('system')
        .getPublicUrl(filePath)

      return publicUrl
    } catch (err) {
      console.error('Error uploading asset:', err)
      toast.error('Erro ao fazer upload da imagem')
      return null
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  return {
    loading,
    visualIdentity,
    updateVisualIdentity,
    uploadAsset,
    refresh: fetchSettings
  }
}
