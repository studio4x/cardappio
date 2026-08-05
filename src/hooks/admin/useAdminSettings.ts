import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export interface VisualIdentity {
  logo_dark_url: string
  logo_light_url: string
  favicon_url: string
  watermark_url?: string
}

export function useAdminSettings() {
  const [loading, setLoading] = useState(true)
  const [visualIdentity, setVisualIdentity] = useState<VisualIdentity>({
    logo_dark_url: '',
    logo_light_url: '',
    favicon_url: '',
    watermark_url: ''
  })
  const [vercelWebhookUrl, setVercelWebhookUrl] = useState('')

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const [visualRes, vercelRes] = await Promise.all([
        supabase
          .from('app_settings')
          .select('value_json')
          .eq('setting_key', 'visual_identity')
          .single(),
        supabase
          .from('app_settings')
          .select('value_json')
          .eq('setting_key', 'vercel_config')
          .maybeSingle()
      ])

      if (visualRes.error) {
        if (visualRes.error.code !== 'PGRST116') {
          throw visualRes.error
        }
      } else if (visualRes.data?.value_json) {
        setVisualIdentity(visualRes.data.value_json as unknown as VisualIdentity)
      }

      if (vercelRes.data?.value_json) {
        setVercelWebhookUrl((vercelRes.data.value_json as any).deploy_webhook_url || '')
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

  const updateVercelWebhookUrl = async (url: string) => {
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({ 
          setting_key: 'vercel_config',
          value_json: { deploy_webhook_url: url },
          description: 'Configurações de integração com a Vercel para auto-deploy',
          updated_at: new Date().toISOString()
        }, { onConflict: 'setting_key' })

      if (error) throw error
      
      setVercelWebhookUrl(url)
      toast.success('Webhook de deploy salvo!')
      return true
    } catch (err) {
      console.error('Error updating vercel config:', err)
      toast.error('Erro ao salvar webhook de deploy')
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
    vercelWebhookUrl,
    updateVisualIdentity,
    updateVercelWebhookUrl,
    uploadAsset,
    refresh: fetchSettings
  }
}
