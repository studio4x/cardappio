import { useState, useEffect } from 'react'
import { User, Settings, Bell, CreditCard, ChevronRight, LogOut, Check, Eye, EyeOff, Key, Sparkles, ArrowRight, Loader2, Crown, AlertTriangle, HelpCircle, Menu, X, Utensils, BookOpen, ShoppingBag, Volume2 } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingState } from '@/components/shared/LoadingState'
import { useProfile, useUpdateProfile, useUpdatePreferences } from '@/hooks/auth/useProfile'
import { useNotificationPreferences, useUpdateNotificationPreferences } from '@/hooks/notifications/useNotifications'
import { useAuth } from '@/app/providers/AuthProvider'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useSubscription } from '@/hooks/subscription/useSubscription'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

/**
 * ProfilePreferencesPage (Screen 15)
 * 
 * Tabbed interface for:
 * - Profile basics (Name, Email)
 * - Meal Preferences (People count, days, types)
 * - Notifications (In-app types & Web Push registration)
 * - Subscription info
 */
export function ProfilePreferencesPage() {
  const { profile, preferences, isLoading } = useProfile()
  const { subscription, checkoutMutation, refetchSubscription } = useSubscription()
  const { data: notifPrefs, isLoading: isLoadingNotifs } = useNotificationPreferences()
  
  const updateProfile = useUpdateProfile()
  const updatePreferences = useUpdatePreferences()
  const updateNotifPrefs = useUpdateNotificationPreferences()
  const { signOut, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [isResettingOnboarding, setIsResettingOnboarding] = useState(false)

  const handleResetOnboarding = async () => {
    if (!profile?.id) return
    
    const confirm = window.confirm('Deseja realmente reiniciar o assistente de configuração? Suas preferências atuais serão mantidas até que você preencha o assistente novamente.')
    if (!confirm) return

    setIsResettingOnboarding(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ onboarding_completed_at: null })
        .eq('id', profile.id)

      if (error) throw error

      toast.success('Assistente de configuração reiniciado!')
      await refreshProfile()
      navigate('/app/onboarding', { replace: true })
    } catch (err: any) {
      console.error(err)
      toast.error('Erro ao reiniciar o assistente. Tente novamente.')
    } finally {
      setIsResettingOnboarding(false)
    }
  }

  const [searchParams, setSearchParams] = useSearchParams()
  const rawTab = searchParams.get('tab')
  const activeTab = (
    rawTab === 'preferencias' || rawTab === 'notificacoes' || rawTab === 'assinatura' || rawTab === 'sobre'
      ? rawTab
      : 'dados'
  )
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false)
  const [selectedPlanId, setSelectedPlanId] = useState<string>('')
  const [selectedInterval, setSelectedInterval] = useState<'monthly' | 'yearly'>('monthly')

  const { data: plans } = useQuery({
    queryKey: ['public-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price_monthly', { ascending: true })
      if (error) throw error
      return data
    }
  })

  const paidPlans = plans?.filter(p => p.price_monthly > 0) || []

  // Cancel / Refund states and handlers
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [isConfirmCancelModalOpen, setIsConfirmCancelModalOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelConfirmText, setCancelConfirmText] = useState('')
  const [isCanceling, setIsCanceling] = useState(false)

  const { data: transactions, refetch: refetchTransactions } = useQuery({
    queryKey: ['user-transactions', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return []
      const { data, error } = await supabase
        .from('subscription_events')
        .select('*')
        .eq('user_id', profile.id)
        .in('event_type', ['checkout_completed', 'refund'])
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!profile?.id
  })

  const handleProcessCancel = async () => {
    if (cancelConfirmText !== 'CONFIRMAR CANCELAMENTO') {
      toast.error('Por favor, digite a frase de confirmação exatamente como solicitada.')
      return
    }
    if (!cancelReason.trim()) {
      toast.error('Por favor, descreva o motivo do cancelamento.')
      return
    }

    setIsCanceling(true)
    try {
      const { data, error } = await supabase.functions.invoke('cancel-subscription', {
        body: { reason: cancelReason }
      })

      if (error) throw error

      const result = data?.data
      if (data?.success || result?.success) {
        toast.success(
          result?.refunded 
            ? 'Assinatura cancelada e reembolso solicitado com sucesso!' 
            : 'Assinatura cancelada com sucesso!'
        )
        setIsConfirmCancelModalOpen(false)
        setIsCancelModalOpen(false)
        setCancelReason('')
        setCancelConfirmText('')
        await refreshProfile()
        await refetchSubscription()
        await refetchTransactions()
      } else {
        toast.error(result?.message || data?.error || 'Erro ao processar o cancelamento. Tente novamente.')
      }
    } catch (err: any) {
      console.error('Error canceling subscription:', err)
      toast.error(err.message || 'Erro de rede ou falha na Edge Function.')
    } finally {
      setIsCanceling(false)
    }
  }

  const handleOpenInvoice = async (invoiceId: string) => {
    if (!invoiceId) return
    try {
      const { data, error } = await supabase.functions.invoke('get-invoice-url', {
        body: { invoiceId }
      })
      if (error) throw error
      const url = data?.hosted_invoice_url || data?.data?.hosted_invoice_url
      if (url) {
        window.open(url, '_blank')
      } else {
        toast.error('URL da fatura não encontrada.')
      }
    } catch (err) {
      console.error('Error fetching invoice url:', err)
      toast.error('Erro ao buscar fatura na Stripe.')
    }
  }

  useEffect(() => {
    if (paidPlans.length > 0 && !selectedPlanId) {
      setSelectedPlanId(paidPlans[0].id)
    }
  }, [paidPlans, selectedPlanId])

  const handleUpgrade = async () => {
    if (!selectedPlanId) return
    try {
      await checkoutMutation.mutateAsync({
        planId: selectedPlanId,
        interval: selectedInterval === 'yearly' ? 'yearly' : 'monthly'
      })
    } catch (err) {
      console.error(err)
    }
  }
  
  // Local state for profile and meal preferences
  const [fullName, setFullName] = useState('')
  const [householdSize, setHouseholdSize] = useState(2)
  const [planDays, setPlanDays] = useState(5)
  const [mealModes, setMealModes] = useState<string[]>([])

  // Local state for notification preferences
  const [mealReminders, setMealReminders] = useState(true)
  const [dailySummary, setDailySummary] = useState(false)
  const [marketingAlerts, setMarketingAlerts] = useState(true)
  const [systemUpdates, setSystemUpdates] = useState(true)
  const [pushEnabled, setPushEnabled] = useState(false)
  const [isRegisteringPush, setIsRegisteringPush] = useState(false)

  // Password change state
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

  useEffect(() => {
    if (profile) setFullName(profile.full_name || '')
    if (preferences) {
      setHouseholdSize(preferences.household_size)
      setPlanDays(preferences.default_plan_days)
      setMealModes(preferences.default_meal_modes)
    }
  }, [profile, preferences])

  useEffect(() => {
    if (notifPrefs) {
      setMealReminders(notifPrefs.meal_reminders)
      setDailySummary(notifPrefs.daily_summary)
      setMarketingAlerts(notifPrefs.marketing_alerts)
      setSystemUpdates(notifPrefs.system_updates)
      setPushEnabled(notifPrefs.push_enabled)
    }
  }, [notifPrefs])

  if (isLoading || isLoadingNotifs) return <LoadingState message="Carregando seu perfil..." />

  const handleSaveProfile = () => {
    updateProfile.mutate({ full_name: fullName })
  }

  const handleSavePreferences = () => {
    updatePreferences.mutate({ 
      household_size: householdSize,
      default_plan_days: planDays,
      default_meal_modes: mealModes
    })
  }

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem.')
      return
    }
    if (newPassword.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    setIsUpdatingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error

      toast.success('Senha alterada com sucesso!')
      setNewPassword('')
      setConfirmPassword('')
      setShowPassword(false)
      setShowConfirmPassword(false)
    } catch (err: any) {
      console.error(err)
      toast.error('Erro ao alterar a senha. Tente novamente.')
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const toggleMealMode = (mode: string) => {
    setMealModes(prev => 
      prev.includes(mode) ? prev.filter(m => m !== mode) : [...prev, mode]
    )
  }

  // Web Push registration logic
  const subscribeUserToPush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      throw new Error('As notificações push não são suportadas pelo seu navegador ou dispositivo.')
    }

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      throw new Error('A permissão para exibir notificações foi recusada.')
    }

    const registration = await navigator.serviceWorker.ready
    
    // Fallback key matching the one configured in our edge function VAPID
    const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || "BBB4XppXCi3mDOnORLXbX9ExXA4VM1epn32huhPA_mHgzRZVxjcnxoobw-rDGYwJKNg9Oie6tlg4ro02Hu3O94c"
    
    const subscribeOptions = {
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    }

    return await registration.pushManager.subscribe(subscribeOptions)
  }

  function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  const handleSaveNotifPreferences = async () => {
    setIsRegisteringPush(true)
    try {
      let pushToken = notifPrefs?.push_token || null
      let isPushActive = pushEnabled

      if (pushEnabled && !notifPrefs?.push_enabled) {
        // Toggle push notifications ON
        const subscription = await subscribeUserToPush()
        pushToken = JSON.stringify(subscription)
        isPushActive = true
      } else if (!pushEnabled && notifPrefs?.push_enabled) {
        // Toggle push notifications OFF
        isPushActive = false
        pushToken = null
        try {
          const registration = await navigator.serviceWorker.ready
          const subscription = await registration.pushManager.getSubscription()
          if (subscription) {
            await subscription.unsubscribe()
          }
        } catch (e) {
          console.warn('Erro ao cancelar a inscrição no pushManager:', e)
        }
      }

      await updateNotifPrefs.mutateAsync({
        meal_reminders: mealReminders,
        daily_summary: dailySummary,
        marketing_alerts: marketingAlerts,
        system_updates: systemUpdates,
        push_enabled: isPushActive,
        push_token: pushToken
      })
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Erro ao salvar preferências de notificação.')
      // Revert checkbox state
      setPushEnabled(notifPrefs?.push_enabled || false)
    } finally {
      setIsRegisteringPush(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Configurações" 
        subtitle="Gerencie seu perfil, preferências de cardápio e assinatura."
      />

      {/* Mobile Tab Trigger Bar */}
      <div className="md:hidden space-y-1.5">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block px-1">
          Seções de configurações:
        </span>
        <div className="flex items-center justify-between bg-slate-100/80 p-3 rounded-2xl border border-slate-200/50">
          <div className="flex items-center gap-2">
            {(() => {
              const tabs = [
                { id: 'dados', label: 'Dados Pessoais', icon: User },
                { id: 'preferencias', label: 'Planejamento', icon: Settings },
                { id: 'notificacoes', label: 'Notificações', icon: Bell },
                { id: 'assinatura', label: 'Assinatura', icon: CreditCard },
                { id: 'sobre', label: 'Sobre o App', icon: HelpCircle },
              ]
              const activeTabInfo = tabs.find(t => t.id === activeTab) || tabs[0]
              const ActiveIcon = activeTabInfo.icon
              return (
                <>
                  <ActiveIcon className="h-5 w-5 text-primary" />
                  <span className="text-sm font-bold text-slate-800">{activeTabInfo.label}</span>
                </>
              )
            })()}
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-700 text-xs font-bold rounded-xl border border-slate-200/50 shadow-sm cursor-pointer hover:bg-slate-50 transition-all"
          >
            <Menu className="h-4 w-4 text-slate-500" />
            <span>Ver Opções</span>
          </button>
        </div>
      </div>

      {/* Off-canvas Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden animate-in fade-in duration-200">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm" 
            onClick={() => setIsMobileMenuOpen(false)}
          />
          {/* Drawer Panel */}
          <div className="fixed inset-y-0 left-0 w-72 bg-white shadow-2xl flex flex-col p-6 transform transition-transform duration-300 ease-out animate-in slide-in-from-left">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Navegação</h3>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 transition-all cursor-pointer border-none bg-transparent"
              >
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            
            <div className="flex flex-col gap-1.5 py-4 overflow-y-auto">
              {[
                { id: 'dados', label: 'Dados Pessoais', icon: User },
                { id: 'preferencias', label: 'Planejamento', icon: Settings },
                { id: 'notificacoes', label: 'Notificações', icon: Bell },
                { id: 'assinatura', label: 'Assinatura', icon: CreditCard },
                { id: 'sobre', label: 'Sobre o App', icon: HelpCircle },
              ].map(tab => {
                const TabIcon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setSearchParams({ tab: tab.id })
                      setIsMobileMenuOpen(false)
                    }}
                    className={cn(
                      'flex items-center gap-3 w-full px-4 py-3 text-sm font-bold rounded-xl transition-all cursor-pointer text-left border-none outline-none',
                      isActive 
                        ? 'bg-primary/10 text-primary' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                    )}
                  >
                    <TabIcon className={cn("h-5 w-5", isActive ? "text-primary" : "text-slate-400")} />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Desktop Navigation Tabs */}
      <div className="hidden md:flex bg-slate-100/80 p-1.5 rounded-2xl gap-1 overflow-x-auto no-scrollbar border border-slate-200/50">
        {[
          { id: 'dados', label: 'Dados Pessoais', icon: User },
          { id: 'preferencias', label: 'Planejamento', icon: Settings },
          { id: 'notificacoes', label: 'Notificações', icon: Bell },
          { id: 'assinatura', label: 'Assinatura', icon: CreditCard },
          { id: 'sobre', label: 'Sobre o App', icon: HelpCircle },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSearchParams({ tab: tab.id })}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all shrink-0 cursor-pointer border-none',
              activeTab === tab.id 
                ? 'bg-white text-slate-800 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
            )}
          >
            <tab.icon className={cn("h-4 w-4", activeTab === tab.id ? "text-primary" : "text-slate-400")} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="py-4">
        {/* PROFILE TAB */}
        {activeTab === 'dados' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="space-y-4 rounded-xl md:rounded-2xl border p-4 md:p-6 bg-white shadow-sm">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-muted-foreground">Nome completo</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border p-3 focus:outline-none focus:ring-2 focus:ring-primary bg-white text-slate-900"
                  style={{ borderColor: 'var(--color-outline-variant)' }}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-muted-foreground">E-mail</label>
                <input
                  type="email"
                  value={profile?.email}
                  disabled
                  className="w-full rounded-xl border p-3 bg-slate-50 cursor-not-allowed text-slate-500"
                  style={{ borderColor: 'var(--color-outline-variant)' }}
                />
                <p className="text-[10px] text-muted-foreground italic">O e-mail não pode ser alterado diretamente.</p>
              </div>
              <Button 
                onClick={handleSaveProfile} 
                className="w-full sm:w-auto"
                disabled={updateProfile.isPending}
              >
                {updateProfile.isPending ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>

            <div className="space-y-4 rounded-xl md:rounded-2xl border p-4 md:p-6 bg-white shadow-sm mt-6">
              <h3 className="font-bold flex items-center gap-2 mb-2">Segurança</h3>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-muted-foreground">Nova Senha</label>
                <div className="relative">
                  <Key className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full rounded-xl border p-3 pl-10 pr-10 focus:outline-none focus:ring-2 focus:ring-primary bg-white text-slate-900"
                    style={{ borderColor: 'var(--color-outline-variant)' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-muted-foreground">Confirmar Nova Senha</label>
                <div className="relative">
                  <Key className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a nova senha"
                    className="w-full rounded-xl border p-3 pl-10 pr-10 focus:outline-none focus:ring-2 focus:ring-primary bg-white text-slate-900"
                    style={{ borderColor: 'var(--color-outline-variant)' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button 
                onClick={handleUpdatePassword} 
                className="w-full sm:w-auto mt-2"
                disabled={isUpdatingPassword || !newPassword || !confirmPassword}
              >
                {isUpdatingPassword ? 'Alterando...' : 'Alterar Senha'}
              </Button>
            </div>

            <button 
              onClick={() => signOut()}
              className="flex w-full items-center justify-between rounded-xl md:rounded-2xl border p-4 md:p-5 text-red-600 bg-red-50/30 hover:bg-red-50 transition-colors cursor-pointer"
              style={{ borderColor: 'rgba(220, 38, 38, 0.2)' }}
            >
              <div className="flex items-center gap-3">
                <LogOut className="h-5 w-5" />
                <span className="font-semibold">Sair da conta</span>
              </div>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* PREFERENCES TAB */}
        {activeTab === 'preferencias' && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="rounded-xl md:rounded-2xl border p-4 md:p-6 bg-white shadow-sm space-y-5 md:space-y-6">
              <div className="space-y-4">
                <h3 className="font-bold flex items-center gap-2">Configuração Padrão</h3>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Para quantas pessoas você cozinha?</label>
                  <div className="flex gap-2">
                    {[1, 2, 4, 6].map(num => (
                      <button
                        key={num}
                        onClick={() => setHouseholdSize(num)}
                        className={cn(
                          "h-10 w-12 rounded-lg border font-semibold transition-all cursor-pointer",
                          householdSize === num ? "bg-primary text-white border-primary" : "hover:bg-slate-50"
                        )}
                        style={{ backgroundColor: householdSize === num ? 'var(--color-primary)' : '' }}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Quantos dias por semana planejar?</label>
                  <input 
                    type="range" min="1" max="7" step="1" 
                    value={planDays} 
                    onChange={(e) => setPlanDays(parseInt(e.target.value))}
                    className="w-full accent-primary" 
                  />
                  <div className="flex justify-between text-xs font-bold text-primary">
                    <span>1 dia</span>
                    <span className="text-sm bg-primary/10 px-3 py-1 rounded-full">{planDays} dias</span>
                    <span>7 dias</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Refeições por dia</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['lunch', 'dinner'].map(mode => (
                      <button
                        key={mode}
                        onClick={() => toggleMealMode(mode)}
                        className={cn(
                          "flex items-center justify-between p-4 rounded-xl border text-sm font-semibold transition-all cursor-pointer",
                          mealModes.includes(mode) ? "bg-primary/5 border-primary text-primary" : "bg-white"
                        )}
                      >
                        {mode === 'lunch' ? 'Almoço' : 'Jantar'}
                        {mealModes.includes(mode) && <Check className="h-4 w-4" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleSavePreferences} 
                className="w-full"
                disabled={updatePreferences.isPending}
              >
                {updatePreferences.isPending ? 'Salvando...' : 'Salvar Preferências'}
              </Button>
            </div>

            {/* Reset Onboarding Card */}
            <div className="rounded-xl md:rounded-2xl border border-red-100 p-4 md:p-6 bg-red-50/10 shadow-sm space-y-4">
              <div>
                <h4 className="font-bold text-red-600 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Reiniciar Assistente de Configuração
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Redefina suas restrições alimentares, objetivos de saúde e preferências preenchendo o assistente de introdução novamente.
                </p>
              </div>

              <Button
                variant="destructive"
                onClick={handleResetOnboarding}
                disabled={isResettingOnboarding}
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
              >
                {isResettingOnboarding ? 'Reiniciando...' : 'Reiniciar Assistente'}
              </Button>
            </div>
          </div>
        )}

        {/* NOTIFICATIONS TAB */}
        {activeTab === 'notificacoes' && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="rounded-xl md:rounded-2xl border p-4 md:p-6 bg-white shadow-sm space-y-5 md:space-y-6">
              <h3 className="font-bold flex items-center gap-2">Configurações de Notificações</h3>
              
              <div className="space-y-4">
                {/* Web Push Subscription switch */}
                <div className="flex items-center justify-between p-3.5 md:p-4 rounded-xl border bg-slate-50/50">
                  <div>
                    <h4 className="text-sm font-semibold">Notificações no Dispositivo (Push)</h4>
                    <p className="text-xs text-muted-foreground">Receba avisos na tela do celular mesmo com o app fechado.</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={pushEnabled} 
                    onChange={e => setPushEnabled(e.target.checked)}
                    className="h-5 w-5 accent-primary cursor-pointer shrink-0 ml-2"
                  />
                </div>

                {/* Other preference checkboxes */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-start gap-3">
                    <input 
                      id="mealReminders" 
                      type="checkbox" 
                      checked={mealReminders} 
                      onChange={e => setMealReminders(e.target.checked)} 
                      className="h-4 w-4 accent-primary cursor-pointer mt-0.5 shrink-0"
                    />
                    <label htmlFor="mealReminders" className="text-sm font-medium cursor-pointer leading-tight text-slate-700">
                      Lembretes de Preparo Semanal (deixar de molho, descongelar)
                    </label>
                  </div>

                  <div className="flex items-start gap-3">
                    <input 
                      id="dailySummary" 
                      type="checkbox" 
                      checked={dailySummary} 
                      onChange={e => setDailySummary(e.target.checked)} 
                      className="h-4 w-4 accent-primary cursor-pointer mt-0.5 shrink-0"
                    />
                    <label htmlFor="dailySummary" className="text-sm font-medium cursor-pointer leading-tight text-slate-700">
                      Resumo diário do menu planejado
                    </label>
                  </div>

                  <div className="flex items-start gap-3">
                    <input 
                      id="systemUpdates" 
                      type="checkbox" 
                      checked={systemUpdates} 
                      onChange={e => setSystemUpdates(e.target.checked)} 
                      className="h-4 w-4 accent-primary cursor-pointer mt-0.5 shrink-0"
                    />
                    <label htmlFor="systemUpdates" className="text-sm font-medium cursor-pointer leading-tight text-slate-700">
                      Atualizações de sistema e segurança
                    </label>
                  </div>

                  <div className="flex items-start gap-3">
                    <input 
                      id="marketingAlerts" 
                      type="checkbox" 
                      checked={marketingAlerts} 
                      onChange={e => setMarketingAlerts(e.target.checked)} 
                      className="h-4 w-4 accent-primary cursor-pointer mt-0.5 shrink-0"
                    />
                    <label htmlFor="marketingAlerts" className="text-sm font-medium cursor-pointer leading-tight text-slate-700">
                      Dicas de receitas e promoções
                    </label>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleSaveNotifPreferences} 
                className="w-full"
                disabled={updateNotifPrefs.isPending || isRegisteringPush}
              >
                {updateNotifPrefs.isPending || isRegisteringPush ? 'Salvando...' : 'Salvar Configurações'}
              </Button>
            </div>
          </div>
        )}

        {/* SUBSCRIPTION TAB */}
        {activeTab === 'assinatura' && (() => {
          const isPro = profile?.subscription_tier && 
                        profile.subscription_tier !== 'free' && 
                        profile.subscription_tier !== 'plano-gratuito';
          
          // Find plan info if active
          const activePlanName = subscription?.plan?.name || (isPro ? 'Plano Pro' : 'Plano Grátis');
          const isSelectedIntervalYearly = selectedInterval === 'yearly';

          return (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
                
                {/* Cartão de Assinatura Atual */}
                <div className="lg:col-span-5 space-y-4">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400">Seu Status Atual</h4>
                  
                  <div className={cn(
                    "relative overflow-hidden rounded-[2rem] p-5 md:p-6 text-white shadow-xl min-h-[170px] md:aspect-[1.58/1] flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:scale-[1.01]",
                    isPro 
                      ? "bg-gradient-to-br from-amber-500 via-orange-500 to-red-600 shadow-orange-500/10" 
                      : "bg-gradient-to-br from-slate-800 to-slate-950 border border-slate-700/50 shadow-slate-900/10"
                  )}>
                    {/* Glowing effect inside card */}
                    <div className="absolute -right-16 -top-16 w-36 h-36 rounded-full bg-white/10 blur-xl pointer-events-none" />
                    
                    <div className="flex justify-between items-start z-10">
                      <div>
                        <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-white/70">Membro Premium</span>
                        <h3 className="text-xl md:text-2xl font-black tracking-tight mt-1">{activePlanName}</h3>
                      </div>
                      <div className={cn(
                        "rounded-2xl p-2 md:p-3 backdrop-blur-md",
                        isPro ? "bg-white/20" : "bg-white/10"
                      )}>
                        {isPro ? <Crown className="h-5 w-5 md:h-6 md:w-6 text-yellow-300 animate-pulse" /> : <CreditCard className="h-5 w-5 md:h-6 md:w-6 text-slate-300" />}
                      </div>
                    </div>

                    <div className="space-y-4 z-10 mt-4 md:mt-0">
                      {/* Fake Card Number for premium aesthetic */}
                      <p className="font-mono text-sm md:text-lg tracking-[0.25em] text-white/90">
                        {isPro ? "••••  ••••  ••••  2026" : "••••  ••••  ••••  FREE"}
                      </p>
                      
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-[8px] md:text-[9px] font-bold uppercase tracking-wider text-white/60">Validade</p>
                          <p className="text-xs font-semibold mt-0.5">
                            {isPro && subscription?.subscription_until 
                              ? new Date(subscription.subscription_until).toLocaleDateString('pt-BR') 
                              : "Permanente"}
                          </p>
                        </div>
                        <span className={cn(
                          "px-2.5 py-0.5 md:px-3 md:py-1 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-wider border backdrop-blur-md",
                          isPro 
                            ? "bg-yellow-400/25 border-yellow-300/40 text-yellow-200" 
                            : "bg-slate-700/50 border-slate-600/30 text-slate-300"
                        )}>
                          {isPro ? "Ativo PRO" : "Grátis Limitado"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Active Limits Info */}
                  <div className="bg-white rounded-xl md:rounded-2xl border border-slate-100 p-4 md:p-5 shadow-sm space-y-4">
                    <h5 className="font-bold text-slate-900 text-sm">Recursos Disponíveis:</h5>
                    <ul className="space-y-2.5">
                      <li className="flex items-center gap-3 text-xs text-slate-600">
                        <div className={cn("h-4 w-4 rounded-full flex items-center justify-center text-white shrink-0", isPro ? "bg-emerald-500" : "bg-slate-300")}>
                          <Check className="h-2.5 w-2.5 stroke-[3]" />
                        </div>
                        <span>Planejamento semanal: <strong>{isPro ? 'Sem limites' : 'Apenas 1 ativo'}</strong></span>
                      </li>
                      <li className="flex items-center gap-3 text-xs text-slate-600">
                        <div className={cn("h-4 w-4 rounded-full flex items-center justify-center text-white shrink-0", isPro ? "bg-emerald-500" : "bg-slate-300")}>
                          <Check className="h-2.5 w-2.5 stroke-[3]" />
                        </div>
                        <span>Acesso a Receitas: <strong>{isPro ? 'Mais de 500 exclusivas' : 'Apenas receitas básicas'}</strong></span>
                      </li>
                      <li className="flex items-center gap-3 text-xs text-slate-600">
                        <div className={cn("h-4 w-4 rounded-full flex items-center justify-center text-white shrink-0", isPro ? "bg-emerald-500" : "bg-slate-300")}>
                          <Check className="h-2.5 w-2.5 stroke-[3]" />
                        </div>
                        <span>Lista de Compras Inteligente: <strong>{isPro ? 'Automática e Ilimitada' : 'Gerada com restrições'}</strong></span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Planos de Assinatura */}
                <div className="lg:col-span-7 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400">Escolha o seu Upgrade</h4>
                      <p className="text-xs text-slate-500 mt-1">Tenha organização completa e economize tempo na cozinha.</p>
                    </div>

                    {/* Toggle Intervalo */}
                    <div className="flex p-1 bg-slate-100 rounded-xl max-w-[200px] border border-slate-200/50 self-start sm:self-center">
                      <button
                        type="button"
                        onClick={() => setSelectedInterval('monthly')}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                          !isSelectedIntervalYearly ? "bg-white shadow-sm text-primary" : "text-slate-400"
                        )}
                      >
                        Mensal
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedInterval('yearly')}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1",
                          isSelectedIntervalYearly ? "bg-white shadow-sm text-primary" : "text-slate-400"
                        )}
                      >
                        Anual
                        <span className="bg-emerald-100 text-emerald-700 text-[8px] px-1.5 py-0.5 rounded-full font-black">20% OFF</span>
                      </button>
                    </div>
                  </div>

                  {/* Lista de Planos Disponíveis */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {paidPlans.map(plan => {
                      const isUserActivePlan = profile?.subscription_tier === plan.slug;
                      const price = isSelectedIntervalYearly ? plan.price_yearly / 12 : plan.price_monthly;
                      const totalPrice = isSelectedIntervalYearly ? plan.price_yearly : plan.price_monthly;
                      
                      return (
                        <div
                          key={plan.id}
                          className={cn(
                            "rounded-2xl md:rounded-3xl border p-4 md:p-6 bg-white transition-all duration-300 relative flex flex-col justify-between hover:shadow-lg",
                            isUserActivePlan 
                              ? "border-primary ring-2 ring-primary/20" 
                              : "border-slate-100"
                          )}
                        >
                          {isUserActivePlan && (
                            <span className="absolute -top-3 left-6 bg-primary text-white text-[9px] font-black uppercase px-2.5 py-1 rounded-full tracking-wider shadow-sm">
                              Seu Plano
                            </span>
                          )}

                          <div className="space-y-4">
                            <div>
                              <h5 className="font-extrabold text-slate-900 text-lg">{plan.name}</h5>
                              <p className="text-xs text-slate-500 mt-1 min-h-[32px] line-clamp-2">{plan.description}</p>
                            </div>

                            <div className="flex items-baseline gap-1 pt-2">
                              <span className="text-3xl font-black text-slate-900">
                                R$ {price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                              <span className="text-slate-400 text-xs font-semibold">/mês</span>
                            </div>

                            {isSelectedIntervalYearly && (
                              <p className="text-[10px] text-emerald-600 font-bold">
                                Cobrado R$ {totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} por ano
                              </p>
                            )}

                            {/* Plan features checkmarks */}
                            <ul className="space-y-2.5 pt-4 border-t border-slate-50">
                              {(plan.features || [
                                "Cardápios personalizados",
                                "Sugestões de substituição",
                                "Salvar favoritos ilimitados",
                                "Listas de compras completas"
                              ]).map((feature: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-600">
                                  <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                                  <span>{feature}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="pt-6 mt-4">
                            <Button
                              onClick={async () => {
                                try {
                                  await checkoutMutation.mutateAsync({
                                    planId: plan.id,
                                    interval: isSelectedIntervalYearly ? 'yearly' : 'monthly'
                                  });
                                } catch (e) {
                                  console.error(e);
                                }
                              }}
                              disabled={checkoutMutation.isPending || isUserActivePlan}
                              className={cn(
                                "w-full py-3.5 md:py-4.5 rounded-full text-xs font-bold cursor-pointer transition-all",
                                isUserActivePlan 
                                  ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed" 
                                  : "bg-primary hover:opacity-95 text-white shadow-md shadow-primary/10"
                              )}
                            >
                              {checkoutMutation.isPending ? "Processando..." : isUserActivePlan ? "Plano Ativo" : "Escolher Plano"}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Histórico de Transações */}
              <div className="border-t border-slate-100 pt-8 mt-8 space-y-4">
                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400">Histórico de Transações</h4>
                
                {transactions && transactions.length > 0 ? (
                  (() => {
                    const purchases = transactions.filter((t: any) => t.event_type === 'checkout_completed')
                    const refunds = transactions.filter((t: any) => t.event_type === 'refund')

                    if (purchases.length === 0) {
                      return (
                        <div className="bg-slate-50/50 rounded-2xl p-6 text-center border border-dashed border-slate-200 text-slate-400 font-medium text-xs">
                          Nenhuma transação financeira registrada nesta conta.
                        </div>
                      )
                    }

                    return (
                      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              <th className="p-4">Data</th>
                              <th className="p-4">Valor</th>
                              <th className="p-4">Status</th>
                              <th className="p-4 text-right">Ação</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-sm">
                            {purchases.map((tx: any) => {
                              const txDate = new Date(tx.created_at)
                              const diffTime = Math.abs(Date.now() - txDate.getTime())
                              const diffDays = diffTime / (1000 * 60 * 60 * 24)
                              
                              const subscriptionId = tx.payload?.data?.object?.subscription || tx.payload?.subscription
                              const isRefunded = refunds.some((r: any) => r.provider_id === subscriptionId)
                              
                              const isEligibleForRefund = diffDays <= 7 && isPro && subscription?.status === 'active' && !isRefunded
                              
                              const amount = tx.payload?.amount_total 
                                ? (tx.payload.amount_total / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                                : 'R$ 39,90' // Fallback

                              const invoiceId = tx.payload?.data?.object?.invoice || tx.payload?.invoice
                              
                              return (
                                <tr key={tx.id} className="hover:bg-slate-50/20">
                                  <td className="p-4">
                                    <div className="font-medium text-slate-600">{txDate.toLocaleDateString('pt-BR')}</div>
                                    {invoiceId && (
                                      <div className="text-[10px] text-slate-400 font-mono mt-0.5" title={invoiceId}>
                                        Pedido: {invoiceId.substring(0, 12)}...
                                      </div>
                                    )}
                                  </td>
                                  <td className="p-4 font-semibold text-slate-800">
                                    {amount}
                                  </td>
                                  <td className="p-4">
                                    <span className={cn(
                                      "inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                                      isRefunded 
                                        ? "bg-rose-50 text-rose-600 border border-rose-100"
                                        : subscription?.status === 'canceled' 
                                          ? "bg-slate-100 text-slate-500 border border-slate-200" 
                                          : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                    )}>
                                      {isRefunded ? 'Reembolsado' : subscription?.status === 'canceled' ? 'Cancelado' : 'Aprovado'}
                                    </span>
                                  </td>
                                  <td className="p-4 text-right">
                                    <div className="flex items-center justify-end gap-2.5">
                                      {invoiceId && (
                                        <Button 
                                          variant="link" 
                                          onClick={() => handleOpenInvoice(invoiceId)}
                                          className="text-xs text-primary hover:text-primary/90 p-0 h-auto font-bold cursor-pointer"
                                        >
                                          Ver Fatura
                                        </Button>
                                      )}
                                      {isEligibleForRefund && (
                                        <>
                                          {invoiceId && <span className="text-slate-200">|</span>}
                                          <Button 
                                            variant="link" 
                                            onClick={() => {
                                              setIsCancelModalOpen(true)
                                            }}
                                            className="text-xs text-rose-500 hover:text-rose-600 p-0 h-auto font-bold cursor-pointer"
                                          >
                                            Solicitar Reembolso
                                          </Button>
                                        </>
                                      )}
                                      {!isEligibleForRefund && !invoiceId && (
                                        <span className="text-xs text-slate-400 font-medium">Sem ações</span>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    )
                  })()
                ) : (
                  <div className="bg-slate-50/50 rounded-2xl p-6 text-center border border-dashed border-slate-200 text-slate-400 font-medium text-xs">
                    Nenhuma transação financeira registrada nesta conta.
                  </div>
                )}
              </div>

            </div>
          );
        })()}

        {/* SOBRE TAB */}
        {activeTab === 'sobre' && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="rounded-xl md:rounded-2xl border p-5 md:p-6 bg-white shadow-sm space-y-6">
              {/* Logo & Welcome Header */}
              <div className="flex flex-col items-center text-center space-y-3 pb-6 border-b border-slate-100">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center shadow-inner">
                  <Utensils className="h-9 w-9 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">Cardappio</h3>
                  <p className="text-xs font-semibold text-primary uppercase tracking-wider mt-0.5">Seu Assistente de Cozinha Inteligente</p>
                </div>
                <p className="text-sm text-slate-600 max-w-md leading-relaxed">
                  O Cardappio nasceu para simplificar sua relação com a cozinha. Nós ajudamos você a planejar suas refeições semanais, descobrir novas receitas e gerar listas de compras completas de forma automática e prática.
                </p>
              </div>

              {/* Core Pillars */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">O que o Cardappio faz por você:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex gap-3 p-4 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/30 transition-all">
                    <div className="h-8 w-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                      <Settings className="h-4 w-4" />
                    </div>
                    <div>
                      <h5 className="font-bold text-sm text-slate-800">Menu Semanal</h5>
                      <p className="text-xs text-slate-500 mt-0.5">Monte o cardápio da sua semana inteira de forma personalizada.</p>
                    </div>
                  </div>

                  <div className="flex gap-3 p-4 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/30 transition-all">
                    <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <div>
                      <h5 className="font-bold text-sm text-slate-800">Livro de Receitas</h5>
                      <p className="text-xs text-slate-500 mt-0.5">Guarde e organize seus pratos favoritos em um só lugar.</p>
                    </div>
                  </div>

                  <div className="flex gap-3 p-4 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/30 transition-all">
                    <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                      <ShoppingBag className="h-4 w-4" />
                    </div>
                    <div>
                      <h5 className="font-bold text-sm text-slate-800">Lista Automática</h5>
                      <p className="text-xs text-slate-500 mt-0.5">Ingredientes agregados de forma inteligente para sua ida ao mercado.</p>
                    </div>
                  </div>

                  <div className="flex gap-3 p-4 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/30 transition-all">
                    <div className="h-8 w-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                      <Volume2 className="h-4 w-4" />
                    </div>
                    <div>
                      <h5 className="font-bold text-sm text-slate-800">Instruções por Voz</h5>
                      <p className="text-xs text-slate-500 mt-0.5">Receitas ditadas passo a passo enquanto você cozinha, sem sujar as mãos.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Version & Technical Info (Presented in a super friendly way) */}
              <div className="border-t border-slate-100 pt-6 space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Informações de Atualização:</h4>
                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-5 space-y-4">
                  
                  {/* Status Indicator */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200/50">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                      </span>
                      <span className="text-xs font-bold text-slate-700">Status do Aplicativo</span>
                    </div>
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                      Conectado e atualizado
                    </span>
                  </div>

                  {/* Version Detail */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div>
                      <p className="font-bold text-slate-800">Versão instalada:</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Indica o pacote de melhorias mais recente que você está utilizando.</p>
                    </div>
                    <span className="font-bold text-slate-600 bg-slate-200/60 px-3 py-1 rounded-xl shrink-0 self-start sm:self-center">
                      v{__BUILD_VERSION__}
                    </span>
                  </div>

                  {/* Update Code Detail */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div>
                      <p className="font-bold text-slate-800">Identificador da versão:</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Um código interno exclusivo que confirma a integridade e a segurança desta versão.</p>
                    </div>
                    <span className="font-mono text-xs text-slate-500 bg-slate-200/60 px-3 py-1 rounded-xl shrink-0 self-start sm:self-center">
                      #{__COMMIT_HASH__}
                    </span>
                  </div>

                  {/* Auto updates note */}
                  <div className="flex gap-2.5 items-start bg-blue-50/30 border border-blue-100/50 rounded-xl p-3 text-[11px] text-slate-600 leading-relaxed">
                    <div className="h-4 w-4 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0 mt-0.5 font-bold">ℹ</div>
                    <span>
                      O Cardappio é atualizado automaticamente em segundo plano sempre que novos recursos são lançados. Não é necessária nenhuma ação manual para manter o aplicativo seguro e funcional.
                    </span>
                  </div>

                </div>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* Modal de Seleção de Plano */}
      <Dialog open={isPlanModalOpen} onOpenChange={setIsPlanModalOpen}>
        <DialogContent className="rounded-2xl md:rounded-3xl p-4 md:p-6 bg-white w-[95vw] md:max-w-[60%]">
          <DialogHeader className="text-left">
            <DialogTitle className="text-xl font-extrabold text-slate-900">Escolha o seu plano Pro</DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              Desbloqueie receitas premium, planejador ilimitado e listas automáticas de compras.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Opções de Intervalo */}
            <div className="flex p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setSelectedInterval('monthly')}
                className={cn(
                  "flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer",
                  selectedInterval === 'monthly' ? "bg-white shadow-sm text-primary" : "text-slate-400"
                )}
              >
                Mensal
              </button>
              <button
                type="button"
                onClick={() => setSelectedInterval('yearly')}
                className={cn(
                  "flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5",
                  selectedInterval === 'yearly' ? "bg-white shadow-sm text-primary" : "text-slate-400"
                )}
              >
                Anual
                <span className="bg-emerald-100 text-emerald-700 text-[9px] px-1.5 py-0.5 rounded-full">Desconto</span>
              </button>
            </div>

            {/* Lista de Planos */}
            <div className="space-y-3">
              {paidPlans.map(plan => {
                const isSelected = selectedPlanId === plan.id
                const price = selectedInterval === 'yearly' ? plan.price_yearly / 12 : plan.price_monthly
                const totalPrice = selectedInterval === 'yearly' ? plan.price_yearly : plan.price_monthly
                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={cn(
                      "w-full flex flex-col sm:flex-row sm:items-center justify-between p-3.5 md:p-4 border rounded-xl md:rounded-2xl text-left transition-all cursor-pointer gap-2",
                      isSelected 
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
                        : "border-slate-200 hover:border-slate-300"
                    )}
                  >
                    <div className="space-y-0.5">
                      <p className="font-bold text-sm md:text-base text-slate-900">{plan.name}</p>
                      <p className="text-[11px] md:text-xs text-slate-500 line-clamp-1">{plan.description}</p>
                    </div>
                    <div className="text-left sm:text-right flex-shrink-0 sm:ml-4">
                      <p className="font-black text-slate-900 text-sm md:text-base">
                        R$ {price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        <span className="text-[9px] md:text-[10px] text-slate-400 font-medium">/mês</span>
                      </p>
                      {selectedInterval === 'yearly' && (
                        <p className="text-[8px] md:text-[9px] text-emerald-600 font-bold">
                          Cobrado R$ {totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/ano
                        </p>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-6">
            <Button
              onClick={handleUpgrade}
              disabled={checkoutMutation.isPending || !selectedPlanId}
              className="w-full py-4.5 rounded-full text-sm font-bold flex items-center justify-center gap-2 shadow-lg cursor-pointer"
            >
              {checkoutMutation.isPending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" /> Iniciando Checkout...
                </>
              ) : (
                <>
                  Ir para Checkout <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setIsPlanModalOpen(false)}
              className="w-full py-3 rounded-full text-slate-400 hover:text-slate-600 font-medium cursor-pointer"
            >
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal 1: Solicitar Reembolso (Retenção e Convencimento) */}
      <Dialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
        <DialogContent className="rounded-[2rem] p-6 bg-white w-[95vw] md:max-w-[60%]">
          <DialogHeader className="text-left space-y-2">
            <DialogTitle className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Crown className="h-6 w-6 text-amber-500 animate-pulse" />
              Mantenha o seu plano Premium!
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 leading-relaxed">
              Dificuldade em manter a rotina saudável? O Cardappio Premium é o seu maior aliado para economizar tempo na cozinha e comer melhor!
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4 border-t border-slate-50 mt-4">
            <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider">O que você perderá ao cancelar:</h5>
            <ul className="space-y-3">
              <li className="flex gap-2.5 items-start text-xs text-slate-600">
                <div className="h-4 w-4 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0 text-rose-500 mt-0.5 font-bold">✕</div>
                <span><strong>Planejamento Ilimitado</strong>: Perda do seu histórico e de criar planejadores completos de 7 ou 14 dias.</span>
              </li>
              <li className="flex gap-2.5 items-start text-xs text-slate-600">
                <div className="h-4 w-4 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0 text-rose-500 mt-0.5 font-bold">✕</div>
                <span><strong>Mais de 500 Receitas Exclusivas</strong>: Perda do acesso às nossas receitas avançadas e funcionais.</span>
              </li>
              <li className="flex gap-2.5 items-start text-xs text-slate-600">
                <div className="h-4 w-4 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0 text-rose-500 mt-0.5 font-bold">✕</div>
                <span><strong>Lista Inteligente Automática</strong>: Terá que organizar seus ingredientes manualmente toda semana.</span>
              </li>
              <li className="flex gap-2.5 items-start text-xs text-slate-600">
                <div className="h-4 w-4 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0 text-rose-500 mt-0.5 font-bold">✕</div>
                <span><strong>Player de Voz (IA)</strong>: Não terá mais as receitas sendo lidas passo a passo por comando de voz.</span>
              </li>
            </ul>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-[11px] leading-relaxed text-slate-600">
              Tem alguma dúvida ou sugestão? Nossa equipe de suporte está pronta para ajudar você a tirar o máximo proveito da plataforma.
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-4">
            <Button
              type="button"
              onClick={() => setIsCancelModalOpen(false)}
              className="w-full py-4.5 rounded-full text-xs font-bold bg-primary hover:bg-primary/90 text-white cursor-pointer shadow-lg"
            >
              Manter Assinatura Ativa
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsCancelModalOpen(false)
                setIsConfirmCancelModalOpen(true)
              }}
              className="w-full py-3 rounded-full text-rose-500 hover:text-rose-600 hover:bg-rose-50/50 font-bold text-xs cursor-pointer"
            >
              Continuar com o cancelamento
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal 2: Justificativa e Confirmação */}
      <Dialog open={isConfirmCancelModalOpen} onOpenChange={setIsConfirmCancelModalOpen}>
        <DialogContent className="rounded-[2rem] p-6 bg-white w-[95vw] md:max-w-[60%]">
          <DialogHeader className="text-left space-y-2">
            <DialogTitle className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-rose-500 animate-pulse" />
              Confirmar Reembolso & Cancelamento
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 leading-relaxed">
              O reembolso será processado no mesmo cartão de crédito utilizado na compra. Dependendo da sua operadora de cartão, o valor será estornado e constará em sua fatura em até 5 a 10 dias úteis.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="cancelReasonInput" className="text-xs font-bold text-slate-700">Por que você está cancelando?</Label>
              <textarea
                id="cancelReasonInput"
                rows={3}
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                placeholder="Por favor, escreva o motivo para nos ajudar a melhorar..."
                className="w-full rounded-xl border p-3 text-xs border-slate-200 outline-none bg-white text-slate-800 placeholder-slate-400 focus:border-primary resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cancelConfirmInput" className="text-xs font-bold text-slate-700">
                Digite a frase abaixo para confirmar:
              </Label>
              <div className="bg-slate-100 p-2.5 rounded-xl border font-mono text-[10px] font-black text-center text-slate-800 select-none">
                CONFIRMAR CANCELAMENTO
              </div>
              <Input
                id="cancelConfirmInput"
                value={cancelConfirmText}
                onChange={(e: any) => setCancelConfirmText(e.target.value)}
                placeholder="Digite a frase em maiúsculas..."
                className="rounded-xl bg-white text-slate-800 text-xs border-slate-200"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-4">
            <Button
              type="button"
              disabled={isCanceling || !cancelReason.trim() || cancelConfirmText !== 'CONFIRMAR CANCELAMENTO'}
              onClick={handleProcessCancel}
              className="w-full py-4.5 rounded-full text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center gap-2 shadow-lg shadow-rose-100 cursor-pointer"
            >
              {isCanceling ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Efetuando cancelamento...
                </>
              ) : (
                <>
                  Prosseguir com o cancelamento
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsConfirmCancelModalOpen(false)
                setIsCancelModalOpen(true)
              }}
              className="w-full py-3 rounded-full text-slate-400 hover:text-slate-600 font-semibold text-xs cursor-pointer"
            >
              Voltar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
