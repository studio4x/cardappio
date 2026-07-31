import { Clock, Users, ChefHat, Crown, Lock } from 'lucide-react'
import type { Recipe } from '@/types/recipes'
import { FavoriteButton } from './FavoriteButton'
import { cn } from '@/lib/utils'
import { useAuth } from '@/app/providers/AuthProvider'

interface RecipeCardProps {
  recipe: Recipe
  onClick: () => void
  isPickerMode?: boolean
  isUserPremium?: boolean
}

export function RecipeCard({
  recipe,
  onClick,
  isPickerMode = false,
  isUserPremium,
}: RecipeCardProps) {
  const { user } = useAuth()
  const resolvedIsUserPremium = isUserPremium !== undefined
    ? isUserPremium
    : !!(user?.subscription_tier && user.subscription_tier !== 'free' && user.subscription_tier !== 'plano-gratuito')

  const difficultyLabels = { easy: 'Fácil', medium: 'Médio', hard: 'Difícil' }
  const difficultyColors = {
    easy: 'var(--color-success)',
    medium: 'var(--color-warning)',
    hard: 'var(--color-error)',
  }
  const isLocked = recipe.is_premium && !resolvedIsUserPremium

  return (
    <div className="relative w-full">
      {!isPickerMode && !isLocked && (
        <FavoriteButton
          recipeId={recipe.id}
          className="absolute top-2 left-2 z-10"
        />
      )}
      <button
        onClick={onClick}
        className="group flex flex-col rounded-2xl border overflow-hidden text-left transition-shadow w-full hover:shadow-md cursor-pointer"
        style={{
          backgroundColor: 'var(--color-surface-container-lowest)',
          borderColor: isLocked ? 'rgba(245, 158, 11, 0.3)' : 'var(--color-outline-variant)',
        }}
      >
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden w-full" style={{ backgroundColor: 'var(--color-surface-container)' }}>
          {recipe.cover_image_url ? (
            <img
              src={recipe.cover_image_url}
              alt={recipe.title}
              className={cn("h-full w-full object-cover transition-transform", !isLocked && "group-hover:scale-105", isLocked && "brightness-50")}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <ChefHat className="h-10 w-10" style={{ color: 'var(--color-outline)' }} />
            </div>
          )}

          {/* Difficulty badge */}
          {!isLocked && (
            <span
              className="absolute top-2 right-2 rounded-full px-3 py-1 text-xs font-extrabold text-white border border-white/30 shadow-md"
              style={{ backgroundColor: difficultyColors[recipe.difficulty_level] }}
            >
              {difficultyLabels[recipe.difficulty_level]}
            </span>
          )}

          {/* Premium Lock Overlay */}
          {isLocked && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/40 backdrop-blur-[2px]">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-400/90 shadow-lg">
                <Lock className="h-5 w-5 text-amber-950" />
              </div>
              <span className="text-xs font-black text-white uppercase tracking-widest">Exclusivo Pro</span>
            </div>
          )}

          {/* Premium badge no canto superior */}
          {recipe.is_premium && (
            <span className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-amber-400/95 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-950 shadow">
              <Crown className="h-2.5 w-2.5" />
              Pro
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 p-4">
          <h3 className="text-sm font-semibold leading-tight mb-1.5" style={{ color: 'var(--color-on-surface)' }}>
            {recipe.title}
          </h3>
          {recipe.subtitle && (
            <p className="text-xs mb-3 line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>
              {recipe.subtitle}
            </p>
          )}
          {isLocked ? (
            <p className="text-xs font-semibold text-amber-600">Faça upgrade para acessar esta receita.</p>
          ) : (
            <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--color-outline)' }}>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {recipe.prep_time_minutes} min
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {recipe.servings} porções
              </span>
            </div>
          )}
        </div>

        {/* Picker CTA */}
        {isPickerMode && !isLocked && (
          <div
            className="border-t px-4 py-2.5 text-center text-xs font-semibold"
            style={{
              borderColor: 'var(--color-outline-variant)',
              color: 'var(--color-primary)',
            }}
          >
            Selecionar esta receita
          </div>
        )}
      </button>
    </div>
  )
}
