import { ChefHat } from 'lucide-react'

interface RecipeHeroProps {
  title: string
  subtitle?: string | null
  coverImageUrl?: string | null
}

export function RecipeHero({ title, subtitle, coverImageUrl }: RecipeHeroProps) {
  return (
    <>
      {/* Cover image */}
      <div
        className="relative mb-8 aspect-video overflow-hidden rounded-[2rem] shadow-lg"
        style={{ backgroundColor: 'var(--color-surface-container)' }}
      >
        {coverImageUrl ? (
          <img
            src={coverImageUrl}
            alt={title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ChefHat className="h-16 w-16" style={{ color: 'var(--color-outline)' }} />
          </div>
        )}
      </div>

      {/* Title & meta placeholder - actually title is here now */}
      <div className="mb-8">
        <h1
          className="mb-3 text-3xl font-extrabold tracking-tight"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-on-surface)' }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="mb-6 text-base leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            {subtitle}
          </p>
        )}
      </div>
    </>
  )
}
