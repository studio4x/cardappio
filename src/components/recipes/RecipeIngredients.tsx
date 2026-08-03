import type { RecipeIngredient } from '@/types/recipes'
import { Sparkles, Link2 } from 'lucide-react'
import { Link } from 'react-router-dom'

interface RecipeIngredientsProps {
  ingredients: RecipeIngredient[]
  servings?: number
  householdSize?: number
}

export function RecipeIngredients({ ingredients, servings, householdSize }: RecipeIngredientsProps) {
  const sortedIngredients = [...ingredients].sort((a, b) => a.sort_order - b.sort_order)

  // Calcule o fator de escala (se o perfil tiver tamanho de família diferente das porções originais)
  const scaleFactor = (householdSize && servings && servings > 0) ? (householdSize / servings) : 1

  const formatQuantity = (qty: string | null, unit: string | null) => {
    if (!qty && !unit) return ''
    
    let displayQty = qty
    if (qty && scaleFactor !== 1) {
      // Tenta parsear valores numéricos simples (ex: "200", "1.5", "1")
      const num = parseFloat(qty.replace(',', '.'))
      if (!isNaN(num) && num > 0) {
        const scaled = num * scaleFactor
        // Formata com no máximo 2 casas decimais e substitui ponto por vírgula se necessário
        displayQty = Number(scaled.toFixed(2)).toString().replace('.', ',')
      }
    }

    if (displayQty && unit) {
      if (unit.toLowerCase() === 'unidade') {
        return `${displayQty} ${displayQty.trim() === '1' ? 'unidade' : 'unidades'}`
      }
      return `${displayQty} ${unit}`
    }
    return displayQty || unit || ''
  }

  return (
    <section className="mb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <h2
          className="text-xl font-bold"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-on-surface)' }}
        >
          Ingredientes
        </h2>
        {scaleFactor !== 1 && householdSize && (
          <span className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-xl flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            Ajustado para {householdSize} pessoas
          </span>
        )}
      </div>

      {scaleFactor !== 1 && householdSize && servings && (
        <div className="mb-4 text-xs font-semibold bg-primary/5 text-primary border border-primary/10 px-4 py-3 rounded-2xl flex items-center gap-2 shadow-sm">
          <Sparkles className="h-4 w-4 shrink-0 text-primary" />
          <span>
            Quantidades multiplicadas por <strong>{scaleFactor.toFixed(1).replace('.0', '')}x</strong> para cozinhar para a sua família de <strong>{householdSize} pessoas</strong> (receita original: {servings} {servings === 1 ? 'porção' : 'porções'}).
          </span>
        </div>
      )}

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
                  {formatQuantity(ing.quantity_label, ing.unit) && (
                    <span className="ml-1" style={{ color: 'var(--color-text-secondary)' }}>
                      — {formatQuantity(ing.quantity_label, ing.unit)}
                    </span>
                  )}
                  {ing.is_optional && (
                    <span className="ml-2 text-sm italic" style={{ color: 'var(--color-outline)' }}>
                      (opcional)
                    </span>
                  )}
                  {/* Linked recipe reference */}
                  {ing.linked_recipe && (
                    <Link
                      to={`/app/receitas/${ing.linked_recipe.slug}`}
                      className="ml-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline transition-colors"
                    >
                      <Link2 className="h-3 w-3 shrink-0" />
                      ver receita: {ing.linked_recipe.title}
                    </Link>
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

