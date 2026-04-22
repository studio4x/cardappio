import type { RecipeIngredient } from '@/types/recipes'

interface RecipeIngredientsProps {
  ingredients: RecipeIngredient[]
}

export function RecipeIngredients({ ingredients }: RecipeIngredientsProps) {
  const sortedIngredients = [...ingredients].sort((a, b) => a.sort_order - b.sort_order)

  return (
    <section className="mb-10">
      <h2
        className="mb-4 text-xl font-bold"
        style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-on-surface)' }}
      >
        Ingredientes
      </h2>
      <div
        className="rounded-[2rem] border p-6"
        style={{
          backgroundColor: 'var(--color-surface-container-lowest)',
          borderColor: 'var(--color-outline-variant)',
        }}
      >
        {sortedIngredients.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Nenhum ingrediente cadastrado.
          </p>
        ) : (
          <ul className="space-y-4">
            {sortedIngredients.map((ing) => (
              <li key={ing.id} className="flex items-start gap-3 text-base">
                <div
                  className="mt-2 h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                />
                <div>
                  <span className="font-medium" style={{ color: 'var(--color-on-surface)' }}>{ing.name}</span>
                  {ing.quantity_label && (
                    <span className="ml-1" style={{ color: 'var(--color-text-secondary)' }}>
                      — {ing.quantity_label}
                    </span>
                  )}
                  {ing.is_optional && (
                    <span className="ml-2 text-sm italic" style={{ color: 'var(--color-outline)' }}>
                      (opcional)
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
