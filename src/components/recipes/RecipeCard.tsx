import { Clock, Users, ChefHat } from 'lucide-react'
import type { Recipe } from '@/types/recipes'
import { FavoriteButton } from './FavoriteButton'

interface RecipeCardProps {
  recipe: Recipe
  onClick: () => void
  isPickerMode?: boolean
}

export function RecipeCard({
  recipe,
  onClick,
  isPickerMode = false,
}: RecipeCardProps) {
  const difficultyLabels = { easy: 'Fácil', medium: 'Médio', hard: 'Difícil' }
  const difficultyColors = {
    easy: 'var(--color-success)',
    medium: 'var(--color-warning)',
    hard: 'var(--color-error)',
  }

  return (
    <div className="relative w-full">
      {!isPickerMode && (
        <FavoriteButton
          recipeId={recipe.id}
          className="absolute top-2 left-2 z-10"
        />
      )}
      <button
        onClick={onClick}
        className="group flex flex-col rounded-2xl border overflow-hidden text-left transition-shadow hover:shadow-md cursor-pointer w-full"
        style={{
          backgroundColor: 'var(--color-surface-container-lowest)',
          borderColor: 'var(--color-outline-variant)',
        }}
      >
        {/* Image */}
        <div className="relative aspect-video overflow-hidden w-full" style={{ backgroundColor: 'var(--color-surface-container)' }}>
          {recipe.cover_image_url ? (
            <img
              src={recipe.cover_image_url}
              alt={recipe.title}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <ChefHat className="h-10 w-10" style={{ color: 'var(--color-outline)' }} />
            </div>
          )}
          {/* Difficulty badge */}
          <span
            className="absolute top-2 right-2 rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
            style={{ backgroundColor: difficultyColors[recipe.difficulty_level] }}
          >
            {difficultyLabels[recipe.difficulty_level]}
          </span>
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
      </div>

      {/* Picker CTA */}
      {isPickerMode && (
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
