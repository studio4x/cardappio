import { useState, useEffect } from 'react'
import { User, Settings, Bell, CreditCard, ChevronRight, LogOut, Check } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingState } from '@/components/shared/LoadingState'
import { useProfile, useUpdateProfile, useUpdatePreferences } from '@/hooks/auth/useProfile'
import { useAuth } from '@/app/providers/AuthProvider'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * ProfilePreferencesPage (Screen 15)
 * 
 * Tabbed interface for:
 * - Profile basics (Name, Email)
 * - Meal Preferences (People count, days, types)
 * - Subscription info
 */
export function ProfilePreferencesPage() {
  const { profile, preferences, isLoading } = useProfile()
  const updateProfile = useUpdateProfile()
  const updatePreferences = useUpdatePreferences()
  const { signOut } = useAuth()

  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'subscription'>('profile')
  
  // Local state for forms
  const [fullName, setFullName] = useState('')
  const [householdSize, setHouseholdSize] = useState(2)
  const [planDays, setPlanDays] = useState(5)
  const [mealModes, setMealModes] = useState<string[]>([])

  useEffect(() => {
    if (profile) setFullName(profile.full_name || '')
    if (preferences) {
      setHouseholdSize(preferences.household_size)
      setPlanDays(preferences.default_plan_days)
      setMealModes(preferences.default_meal_modes)
    }
  }, [profile, preferences])

  if (isLoading) return <LoadingState message="Carregando seu perfil..." />

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

  const toggleMealMode = (mode: string) => {
    setMealModes(prev => 
      prev.includes(mode) ? prev.filter(m => m !== mode) : [...prev, mode]
    )
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
                  className="w-full rounded-xl border p-3 focus:outline-none focus:ring-2 focus:ring-primary"
                  style={{ borderColor: 'var(--color-outline-variant)' }}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-muted-foreground">E-mail</label>
                <input
                  type="email"
                  value={profile?.email}
                  disabled
                  className="w-full rounded-xl border p-3 bg-slate-50 cursor-not-allowed"
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
              <Button variant="outline" className="w-full bg-white text-slate-900 hover:bg-slate-100 border-none font-bold">
                Mudar para Pro
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
