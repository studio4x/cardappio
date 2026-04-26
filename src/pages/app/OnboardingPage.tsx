import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/app/providers/AuthProvider'
import { cn } from '@/lib/utils'

/**
 * OnboardingPage
 *
 * Per SCREENS.md (Screen 06) and CODEX_CARDAPPIO_APP_SPEC.md:
 * Multi-step flow to collect minimum preferences.
 *
 * Steps:
 * 1. household_size — quantas pessoas comem na sua casa?
 * 2. default_meal_modes — almoço, jantar, ou ambos?
 * 3. default_plan_days — quantos dias da semana quer planejar?
 * 4. dietary_restrictions — restrições ou preferências alimentares?
 * 5. primary_goal — qual seu objetivo principal?
 *
 * On completion:
 * - Inserts into user_preferences
 * - Updates profiles.onboarding_completed_at
 * - Redirects to /app
 */

const TOTAL_STEPS = 5

interface OnboardingData {
  household_size: number
  default_meal_modes: string[]
  default_plan_days: number
  dietary_restrictions: string[]
  primary_goal: string
}

// Selectable option card component
function SelectableOption({
  label,
  description,
  selected,
  onClick,
  emoji,
}: {
  label: string
  description?: string
  selected: boolean
  onClick: () => void
  emoji?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-all cursor-pointer w-full',
      )}
      style={{
        borderColor: selected ? 'var(--color-primary)' : 'var(--color-outline-variant)',
        backgroundColor: selected
          ? 'color-mix(in srgb, var(--color-primary) 8%, transparent)'
          : 'var(--color-surface-container-lowest)',
      }}
    >
      {emoji && <span className="text-xl shrink-0">{emoji}</span>}
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-medium"
          style={{ color: selected ? 'var(--color-primary)' : 'var(--color-on-surface)' }}
        >
          {label}
        </p>
        {description && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            {description}
          </p>
        )}
      </div>
      {selected && (
        <div
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          <Check className="h-3 w-3 text-white" />
        </div>
      )}
    </button>
  )
}

export function OnboardingPage() {
  const navigate = useNavigate()
  const { supabaseUser, refreshProfile } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [data, setData] = useState<OnboardingData>({
    household_size: 2,
    default_meal_modes: ['lunch', 'dinner'],
    default_plan_days: 5,
    dietary_restrictions: [],
    primary_goal: '',
  })

  const canProceed = () => {
    // Todas as etapas são opcionais agora, permitindo avançar com valores padrão
    return true
  }

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const toggleMealMode = (mode: string) => {
    setData((prev) => ({
      ...prev,
      default_meal_modes: prev.default_meal_modes.includes(mode)
        ? prev.default_meal_modes.filter((m) => m !== mode)
        : [...prev.default_meal_modes, mode],
    }))
  }

  const toggleRestriction = (restriction: string) => {
    setData((prev) => ({
      ...prev,
      dietary_restrictions: prev.dietary_restrictions.includes(restriction)
        ? prev.dietary_restrictions.filter((r) => r !== restriction)
        : [...prev.dietary_restrictions, restriction],
    }))
  }

  const handleFinish = async () => {
    if (!supabaseUser) return
    setIsLoading(true)
    setError(null)

    try {
      // 1. Insert user_preferences
      const { error: prefError } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: supabaseUser.id,
          household_size: data.household_size,
          default_meal_modes: data.default_meal_modes,
          default_plan_days: data.default_plan_days,
          dietary_restrictions: data.dietary_restrictions,
          dietary_preferences: [],
          primary_goal: data.primary_goal,
          preferred_recipe_contexts: [],
        }, { 
          onConflict: 'user_id' 
        })

      if (prefError) {
        console.error('Error saving preferences:', prefError)
        setError('Erro ao salvar preferências. Tente novamente.')
        return
      }

      // 2. Mark onboarding as complete
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ onboarding_completed_at: new Date().toISOString() })
        .eq('id', supabaseUser.id)

      if (profileError) {
        console.error('Error updating profile:', profileError)
        setError('Erro ao finalizar onboarding. Tente novamente.')
        return
      }

      // 3. Refresh AuthProvider data
      await refreshProfile()

      // 4. Navigate to app
      navigate('/app', { replace: true })
    } catch {
      setError('Erro inesperado. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg py-8 px-5">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            Passo {currentStep} de {TOTAL_STEPS}
          </span>
          <span className="text-xs font-medium" style={{ color: 'var(--color-primary)' }}>
            {Math.round((currentStep / TOTAL_STEPS) * 100)}%
          </span>
        </div>
        <div
          className="h-1.5 rounded-full overflow-hidden"
          style={{ backgroundColor: 'var(--color-surface-container-high)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${(currentStep / TOTAL_STEPS) * 100}%`,
              backgroundColor: 'var(--color-primary)',
            }}
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          className="mb-4 rounded-lg px-4 py-3 text-sm"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-error) 10%, transparent)',
            color: 'var(--color-error)',
          }}
        >
          {error}
        </div>
      )}

      {/* Step content */}
      <div
        className="rounded-2xl border p-6"
        style={{
          backgroundColor: 'var(--color-surface-container-lowest)',
          borderColor: 'var(--color-outline-variant)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        {/* Step 1: Household size */}
        {currentStep === 1 && (
          <div>
            <h2
              className="mb-2 text-xl font-bold"
              style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-on-surface)' }}
            >
              Quantas pessoas comem na sua casa?
            </h2>
            <p className="mb-6 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Isso nos ajuda a ajustar as porções das receitas.
            </p>
            <div className="space-y-2">
              {[
                { value: 1, label: 'Só eu', emoji: '🧑' },
                { value: 2, label: '2 pessoas', emoji: '👫' },
                { value: 3, label: '3 pessoas', emoji: '👨‍👩‍👦' },
                { value: 4, label: '4 pessoas', emoji: '👨‍👩‍👧‍👦' },
                { value: 5, label: '5 ou mais', emoji: '👨‍👩‍👧‍👦‍' },
              ].map((option) => (
                <SelectableOption
                  key={option.value}
                  label={option.label}
                  emoji={option.emoji}
                  selected={data.household_size === option.value}
                  onClick={() => setData((prev) => ({ ...prev, household_size: option.value }))}
                />
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Meal modes */}
        {currentStep === 2 && (
          <div>
            <h2
              className="mb-2 text-xl font-bold"
              style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-on-surface)' }}
            >
              Quais refeições quer planejar?
            </h2>
            <p className="mb-6 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Você pode escolher uma ou ambas.
            </p>
            <div className="space-y-2">
              <SelectableOption
                label="Almoço"
                emoji="🍽️"
                description="Planeje o que comer no almoço"
                selected={data.default_meal_modes.includes('lunch')}
                onClick={() => toggleMealMode('lunch')}
              />
              <SelectableOption
                label="Jantar"
                emoji="🌙"
                description="Planeje o que comer no jantar"
                selected={data.default_meal_modes.includes('dinner')}
                onClick={() => toggleMealMode('dinner')}
              />
            </div>
          </div>
        )}

        {/* Step 3: Plan days */}
        {currentStep === 3 && (
          <div>
            <h2
              className="mb-2 text-xl font-bold"
              style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-on-surface)' }}
            >
              Quantos dias da semana quer planejar?
            </h2>
            <p className="mb-6 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Você pode mudar isso depois nas configurações.
            </p>
            <div className="space-y-2">
              {[
                { value: 5, label: 'Segunda a sexta', description: 'Dias úteis', emoji: '📅' },
                { value: 7, label: 'Semana inteira', description: 'Inclusive fins de semana', emoji: '🗓️' },
                { value: 3, label: '3 dias', description: 'Para quem quer começar devagar', emoji: '🌱' },
              ].map((option) => (
                <SelectableOption
                  key={option.value}
                  label={option.label}
                  description={option.description}
                  emoji={option.emoji}
                  selected={data.default_plan_days === option.value}
                  onClick={() => setData((prev) => ({ ...prev, default_plan_days: option.value }))}
                />
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Dietary restrictions */}
        {currentStep === 4 && (
          <div>
            <h2
              className="mb-2 text-xl font-bold"
              style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-on-surface)' }}
            >
              Alguma preferência ou restrição alimentar?
            </h2>
            <p className="mb-6 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Opcional. Selecione quantas quiser ou pule.
            </p>
            <div className="space-y-2">
              {[
                { value: 'sem_gluten', label: 'Sem glúten', emoji: '🌾' },
                { value: 'sem_lactose', label: 'Sem lactose', emoji: '🥛' },
                { value: 'vegetariano', label: 'Vegetariano', emoji: '🥬' },
                { value: 'vegano', label: 'Vegano', emoji: '🌱' },
                { value: 'low_carb', label: 'Low carb', emoji: '🥑' },
                { value: 'sem_frutos_do_mar', label: 'Sem frutos do mar', emoji: '🦐' },
              ].map((option) => (
                <SelectableOption
                  key={option.value}
                  label={option.label}
                  emoji={option.emoji}
                  selected={data.dietary_restrictions.includes(option.value)}
                  onClick={() => toggleRestriction(option.value)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Step 5: Primary goal */}
        {currentStep === 5 && (
          <div>
            <h2
              className="mb-2 text-xl font-bold"
              style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-on-surface)' }}
            >
              Qual seu principal objetivo?
            </h2>
            <p className="mb-6 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Isso nos ajuda a personalizar sua experiência.
            </p>
            <div className="space-y-2">
              {[
                { value: 'save_time', label: 'Economizar tempo', emoji: '⏱️', description: 'Menos tempo decidindo, mais tempo vivendo' },
                { value: 'save_money', label: 'Economizar dinheiro', emoji: '💰', description: 'Comprar só o necessário, sem desperdício' },
                { value: 'eat_better', label: 'Comer melhor', emoji: '🥗', description: 'Refeições mais equilibradas e variadas' },
                { value: 'family_meals', label: 'Organizar refeições da família', emoji: '👨‍👩‍👧‍👦', description: 'Planejamento para toda a família' },
                { value: 'variety', label: 'Variar o cardápio', emoji: '🔄', description: 'Sair da rotina de sempre' },
              ].map((option) => (
                <SelectableOption
                  key={option.value}
                  label={option.label}
                  description={option.description}
                  emoji={option.emoji}
                  selected={data.primary_goal === option.value}
                  onClick={() => setData((prev) => ({ ...prev, primary_goal: option.value }))}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <button
          type="button"
          onClick={handleBack}
          disabled={currentStep === 1}
          className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-30 cursor-pointer"
          style={{ color: 'var(--color-on-surface-variant)' }}
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>

        {currentStep < TOTAL_STEPS ? (
          <button
            type="button"
            onClick={handleNext}
            disabled={!canProceed()}
            className="inline-flex items-center gap-1.5 rounded-lg px-6 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 cursor-pointer"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            Próximo
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleFinish}
            disabled={!canProceed() || isLoading}
            className="inline-flex items-center gap-1.5 rounded-lg px-6 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 cursor-pointer"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {isLoading ? 'Salvando...' : 'Finalizar'}
          </button>
        )}
      </div>
    </div>
  )
}
