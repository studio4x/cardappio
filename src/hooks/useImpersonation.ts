import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { useImpersonateUser } from '@/hooks/admin/useAdminUsers'
import { toast } from 'sonner'

const STORAGE_KEY = 'cardappio_impersonation'
const EVENT_NAME = 'cardappio:impersonation_change'

export interface ImpersonationData {
  adminSession: {
    access_token: string
    refresh_token: string
  }
  adminUser: {
    email: string
    name: string
  }
  targetUser: {
    id: string
    email: string
    name: string
  }
  startedAt: string
}

export function getImpersonationData(): ImpersonationData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as ImpersonationData
  } catch {
    return null
  }
}

export function useImpersonation() {
  const navigate = useNavigate()
  const impersonateMutation = useImpersonateUser()
  const [data, setData] = useState<ImpersonationData | null>(() => getImpersonationData())
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    const handleStorageChange = () => {
      setData(getImpersonationData())
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener(EVENT_NAME, handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener(EVENT_NAME, handleStorageChange)
    }
  }, [])

  const startImpersonation = useCallback(
    async (targetUser: { id: string; email: string; full_name?: string | null }) => {
      setIsProcessing(true)
      const toastId = 'impersonate-process'
      toast.loading('Iniciando modo impersonação...', { id: toastId })

      try {
        // 1. Capture current admin session tokens
        const { data: { session: currentAdminSession }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError || !currentAdminSession) {
          throw new Error('Sessão de administrador inválida. Refaça o login antes de impersonar.')
        }

        const adminEmail = currentAdminSession.user?.email || 'Admin'
        const targetName = targetUser.full_name || targetUser.email

        const impersonationPayload: ImpersonationData = {
          adminSession: {
            access_token: currentAdminSession.access_token,
            refresh_token: currentAdminSession.refresh_token,
          },
          adminUser: {
            email: adminEmail,
            name: adminEmail.split('@')[0],
          },
          targetUser: {
            id: targetUser.id,
            email: targetUser.email,
            name: targetName,
          },
          startedAt: new Date().toISOString(),
        }

        // 2. Request OTP token hash from backend Edge Function
        const response = await impersonateMutation.mutateAsync({ userId: targetUser.id })
        if (!response?.token_hash) {
          throw new Error('Falha ao obter token de acesso para o usuário.')
        }

        // 3. Save admin session snapshot locally
        localStorage.setItem(STORAGE_KEY, JSON.stringify(impersonationPayload))
        window.dispatchEvent(new Event(EVENT_NAME))

        // 4. Verify OTP to switch session to target user
        const { error: otpError } = await supabase.auth.verifyOtp({
          token_hash: response.token_hash,
          type: 'magiclink',
        })

        if (otpError) {
          // Rollback local storage if OTP verification fails
          localStorage.removeItem(STORAGE_KEY)
          window.dispatchEvent(new Event(EVENT_NAME))
          throw otpError
        }

        toast.success(`Navegando como ${targetUser.email}`, { id: toastId })
        setData(impersonationPayload)
        navigate('/app')
      } catch (err: any) {
        console.error('Error starting impersonation:', err)
        toast.error(err.message || 'Erro ao iniciar modo impersonação.', { id: toastId })
      } finally {
        setIsProcessing(false)
      }
    },
    [impersonateMutation, navigate]
  )

  const stopImpersonation = useCallback(async () => {
    setIsProcessing(true)
    const toastId = 'stop-impersonate-process'
    toast.loading('Restaurando sessão de administrador...', { id: toastId })

    const stored = getImpersonationData()

    try {
      if (stored?.adminSession?.access_token && stored?.adminSession?.refresh_token) {
        // 1. Restore original admin session
        const { error: restoreError } = await supabase.auth.setSession({
          access_token: stored.adminSession.access_token,
          refresh_token: stored.adminSession.refresh_token,
        })

        if (restoreError) {
          console.warn('Could not restore admin session via saved tokens:', restoreError)
          toast.error('Não foi possível restaurar a sessão do administrador automaticamente. Faça login novamente.', { id: toastId })
          localStorage.removeItem(STORAGE_KEY)
          window.dispatchEvent(new Event(EVENT_NAME))
          navigate('/login')
          return
        }
      } else {
        // Fallback logout if admin session wasn't saved properly
        await supabase.auth.signOut()
        navigate('/login')
      }

      // 2. Clear local storage and state
      localStorage.removeItem(STORAGE_KEY)
      window.dispatchEvent(new Event(EVENT_NAME))
      setData(null)

      toast.success('Sessão de administrador restaurada com sucesso!', { id: toastId })
      navigate('/admin/usuarios')
    } catch (err: any) {
      console.error('Error stopping impersonation:', err)
      toast.error('Erro ao restaurar sessão de administrador.', { id: toastId })
    } finally {
      setIsProcessing(false)
    }
  }, [navigate])

  return {
    isImpersonating: !!data,
    impersonatedUser: data?.targetUser || null,
    adminUser: data?.adminUser || null,
    impersonationData: data,
    isProcessing,
    startImpersonation,
    stopImpersonation,
  }
}
