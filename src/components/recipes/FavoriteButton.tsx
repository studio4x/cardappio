import { Heart } from 'lucide-react'
import { useToggleFavorite, useFavorites } from '@/hooks/recipes/useFavorites'
import { cn } from '@/lib/utils'

interface FavoriteButtonProps {
  recipeId: string
  className?: string
}

export function FavoriteButton({ recipeId, className }: FavoriteButtonProps) {
  const { data: favorites, isLoading } = useFavorites()
  const toggleFavorite = useToggleFavorite()

  const isFavorite = favorites?.some((f: any) => f.id === recipeId) ?? false

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    toggleFavorite.mutate({ recipeId, isFavorite })
  }

  if (isLoading) return null

  return (
    <button
      onClick={handleClick}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-full transition-all hover:scale-110 active:scale-95 cursor-pointer',
        className
      )}
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(4px)',
      }}
    >
      <Heart
        className={cn('h-4 w-4 transition-colors', isFavorite ? 'fill-red-500 text-red-500' : 'text-slate-600')}
        fill={isFavorite ? 'currentColor' : 'none'}
      />
    </button>
  )
}
