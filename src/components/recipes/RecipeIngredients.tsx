import { useState, useEffect } from 'react'
import type { RecipeIngredient } from '@/types/recipes'
import { Sparkles, Link2, Minus, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'

interface RecipeIngredientsProps {
  ingredients: RecipeIngredient[]
  servings?: number
}

export function RecipeIngredients({ ingredients, servings = 2 }: RecipeIngredientsProps) {
  const [currentServings, setCurrentServings] = useState<number>(servings || 2)
  
  // Atualiza as porções se a receita mudar (por exemplo, ao navegar entre receitas)
  useEffect(() => {
    if (servings) {
      setCurrentServings(servings)
    }
  }, [servings])

  const sortedIngredients = [...ingredients].sort((a, b) => a.sort_order - b.sort_order)

  // O fator de escala é calculado com base nas porções selecionadas vs original
  const scaleFactor = (servings && servings > 0) ? (currentServings / servings) : 1

  const handleDecrease = () => {
    if (currentServings > 1) {
      setCurrentServings(prev => prev - 1)
    }
  }

  const handleIncrease = () => {
    setCurrentServings(prev => prev + 1)
  }

  const formatQuantity = (qty: string | null, unit: string | null) => {
    if (!qty && !unit) return ''
    
    let displayQty = qty
    if (qty && scaleFactor !== 1) {
      // Tenta parsear valores numéricos simples (ex: "200", "1.5", "1")
      const num = parseFloat(qty.replace(',', '.'))
      if (!isNaN(num) && num > 0) {
        const scaled = num * scaleFactor
        // Sempre arredondar para cima
        const ceiled = Math.ceil(scaled)
        displayQty = ceiled.toString().replace('.', ',')
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 border-b pb-4" style={{ borderColor: 'var(--color-outline-variant)' }}>
        <div>
          <h2
            className="text-xl font-bold"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-on-surface)' }}
          >
            Ingredientes
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">
            Porções da receita original: {servings} {servings === 1 ? 'pessoa' : 'pessoas'}
          </p>
        </div>
        
        {/* Seletor de Porções (Calculadora) */}
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/80 p-1 rounded-full shrink-0 shadow-sm self-start sm:self-auto">
          <button 
            onClick={handleDecrease}
            disabled={currentServings <= 1}
            className="w-8 h-8 rounded-full bg-white hover:bg-slate-50 border border-slate-100 flex items-center justify-center font-bold text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all shadow-sm"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          
          <span className="text-xs font-black text-slate-800 px-2 min-w-[70px] text-center uppercase tracking-wider select-none">
            {currentServings} {currentServings === 1 ? 'Pessoa' : 'Pessoas'}
          </span>
          
          <button 
            onClick={handleIncrease}
            className="w-8 h-8 rounded-full bg-white hover:bg-slate-50 border border-slate-100 flex items-center justify-center font-bold text-slate-600 active:scale-95 transition-all shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {scaleFactor !== 1 && (
        <div className="mb-5 text-[11px] font-semibold bg-amber-500/5 text-amber-600 border border-amber-500/10 px-4 py-2.5 rounded-2xl flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-amber-500 animate-pulse" />
          <span>
            Quantidades ajustadas em <strong>{scaleFactor.toFixed(2).replace('.00', '')}x</strong> para cozinhar para <strong>{currentServings} {currentServings === 1 ? 'pessoa' : 'pessoas'}</strong> (arredondado para cima).
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

