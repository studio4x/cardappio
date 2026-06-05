import { useState, useEffect } from 'react'
import { User, Settings, Bell, CreditCard, ChevronRight, LogOut, Check, Eye, EyeOff, Key, Sparkles, ArrowRight, Loader2 } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingState } from '@/components/shared/LoadingState'
import { useProfile, useUpdateProfile, useUpdatePreferences } from '@/hooks/auth/useProfile'
import { useNotificationPreferences, useUpdateNotificationPreferences } from '@/hooks/notifications/useNotifications'
import { useAuth } from '@/app/providers/AuthProvider'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useSubscription } from '@/hooks/subscription/useSubscription'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'

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
  const { data: notifPrefs, isLoading: isLoadingNotifs } = useNotificationPreferences()
  
  const updateProfile = useUpdateProfile()
  const updatePreferences = useUpdatePreferences()
  const updateNotifPrefs = useUpdateNotificationPreferences()
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const { checkoutMutation } = useSubscription()

  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'notifications' | 'subscription'>('profile')
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

      {/* Tab Switcher */}
      <div className="flex border-b" style={{ borderColor: 'var(--color-outline-variant)' }}>
        {[
          { id: 'profile', label: 'Dados Pessoais', icon: User },
          { id: 'preferences', label: 'Planejamento', icon: Settings },
          { id: 'notifications', label: 'Notificações', icon: Bell },
          { id: 'subscription', label: 'Assinatura', icon: CreditCard },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all cursor-pointer",
              activeTab === tab.id 
                ? "border-primary text-primary" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
            style={{ 
              borderColor: activeTab === tab.id ? 'var(--color-primary)' : 'transparent',
              color: activeTab === tab.id ? 'var(--color-primary)' : 'inherit'
            }}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="py-4">
        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="space-y-4 rounded-2xl border p-6 bg-white shadow-sm">
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

            <div className="space-y-4 rounded-2xl border p-6 bg-white shadow-sm mt-6">
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
              className="flex w-full items-center justify-between rounded-2xl border p-5 text-red-600 bg-red-50/30 hover:bg-red-50 transition-colors cursor-pointer"
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
        {activeTab === 'preferences' && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="rounded-2xl border p-6 bg-white shadow-sm space-y-6">
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
          </div>
        )}

        {/* NOTIFICATIONS TAB */}
        {activeTab === 'notifications' && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="rounded-2xl border p-6 bg-white shadow-sm space-y-6">
              <h3 className="font-bold flex items-center gap-2">Configurações de Notificações</h3>
              
              <div className="space-y-4">
                {/* Web Push Subscription switch */}
                <div className="flex items-center justify-between p-4 rounded-xl border bg-slate-50/50">
                  <div>
                    <h4 className="text-sm font-semibold">Notificações no Dispositivo (Push)</h4>
                    <p className="text-xs text-muted-foreground">Receba avisos na tela do celular mesmo com o app fechado.</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={pushEnabled} 
                    onChange={e => setPushEnabled(e.target.checked)}
                    className="h-5 w-5 accent-primary cursor-pointer"
                  />
                </div>

                {/* Other preference checkboxes */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3">
                    <input 
                      id="mealReminders" 
                      type="checkbox" 
                      checked={mealReminders} 
                      onChange={e => setMealReminders(e.target.checked)} 
                      className="h-4 w-4 accent-primary cursor-pointer"
                    />
                    <label htmlFor="mealReminders" className="text-sm font-medium cursor-pointer">
                      Lembretes de Preparo Semanal (deixar de molho, descongelar)
                    </label>
                  </div>

                  <div className="flex items-center gap-3">
                    <input 
                      id="dailySummary" 
                      type="checkbox" 
                      checked={dailySummary} 
                      onChange={e => setDailySummary(e.target.checked)} 
                      className="h-4 w-4 accent-primary cursor-pointer"
                    />
                    <label htmlFor="dailySummary" className="text-sm font-medium cursor-pointer">
                      Resumo diário do menu planejado
                    </label>
                  </div>

                  <div className="flex items-center gap-3">
                    <input 
                      id="systemUpdates" 
                      type="checkbox" 
                      checked={systemUpdates} 
                      onChange={e => setSystemUpdates(e.target.checked)} 
                      className="h-4 w-4 accent-primary cursor-pointer"
                    />
                    <label htmlFor="systemUpdates" className="text-sm font-medium cursor-pointer">
                      Atualizações de sistema e segurança
                    </label>
                  </div>

                  <div className="flex items-center gap-3">
                    <input 
                      id="marketingAlerts" 
                      type="checkbox" 
                      checked={marketingAlerts} 
                      onChange={e => setMarketingAlerts(e.target.checked)} 
                      className="h-4 w-4 accent-primary cursor-pointer"
                    />
                    <label htmlFor="marketingAlerts" className="text-sm font-medium cursor-pointer">
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
        {activeTab === 'subscription' && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="rounded-2xl border p-8 bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-xl">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Plano Atual</span>
                  <h3 className="text-2xl font-black">Plano Grátis</h3>
                </div>
                <div className="rounded-full bg-slate-700 p-3">
                  <CreditCard className="h-6 w-6" />
                </div>
              </div>
              <p className="text-slate-300 text-sm mb-8">
                Você está utilizando a versão limitada. Assine o **Cardappio Pro** para desbloquear todas as receitas e listas de compras inteligentes.
              </p>
              <Button 
                onClick={() => setIsPlanModalOpen(true)}
                variant="outline" 
                className="w-full bg-white text-slate-900 hover:bg-slate-100 border-none font-bold cursor-pointer"
              >
                Mudar para Pro
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Seleção de Plano */}
      <Dialog open={isPlanModalOpen} onOpenChange={setIsPlanModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6 bg-white">
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
                      "w-full flex items-center justify-between p-4 border rounded-2xl text-left transition-all cursor-pointer",
                      isSelected 
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
                        : "border-slate-200 hover:border-slate-300"
                    )}
                  >
                    <div className="space-y-1">
                      <p className="font-bold text-slate-900">{plan.name}</p>
                      <p className="text-xs text-slate-500 line-clamp-1">{plan.description}</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <p className="font-black text-slate-900">
                        R$ {price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        <span className="text-[10px] text-slate-400 font-medium">/mês</span>
                      </p>
                      {selectedInterval === 'yearly' && (
                        <p className="text-[9px] text-emerald-600 font-bold">
                          Cobrado R$ {totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/ano
                        </p>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <DialogFooter className="flex flex-col gap-2">
            <Button
              onClick={handleUpgrade}
              disabled={checkoutMutation.isPending || !selectedPlanId}
              className="w-full py-6 rounded-2xl text-md font-bold flex items-center justify-center gap-2"
            >
              {checkoutMutation.isPending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" /> Iniciando Checkout...
                </>
              ) : (
                <>
                  Ir para Checkout <ArrowRight className="h-5 w-5" />
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setIsPlanModalOpen(false)}
              className="w-full text-slate-400 hover:text-slate-600 font-medium"
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
