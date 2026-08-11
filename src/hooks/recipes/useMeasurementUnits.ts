import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export interface IngredientUnitOption {
  value: string
  label: string
  category?: string | null
}

export const FALLBACK_INGREDIENT_UNITS: IngredientUnitOption[] = [
  { value: "a gosto", label: "A gosto", category: "Geral" },
  { value: "caixa", label: "Caixa(s)", category: "Recipiente" },
  { value: "cl", label: "Centilitros (cl)", category: "Volume" },
  { value: "cm", label: "Centímetro(s) (cm)", category: "Medida" },
  { value: "colher (café)", label: "Colher (café)", category: "Colheres" },
  { value: "colher (chá)", label: "Colher (chá)", category: "Colheres" },
  { value: "colher (sobremesa)", label: "Colher (sobremesa)", category: "Colheres" },
  { value: "colher (sopa)", label: "Colher (sopa)", category: "Colheres" },
  { value: "colher de café", label: "Colher(es) de café", category: "Colheres" },
  { value: "colher de chá", label: "Colher(es) de chá", category: "Colheres" },
  { value: "colher de sobremesa", label: "Colher(es) de sobremesa", category: "Colheres" },
  { value: "colher de sopa", label: "Colher(es) de sopa", category: "Colheres" },
  { value: "copo", label: "Copo(s)", category: "Xícaras e Copos" },
  { value: "dl", label: "Decilitros (dl)", category: "Volume" },
  { value: "dente", label: "Dente(s)", category: "Unidade" },
  { value: "fatia", label: "Fatia(s)", category: "Unidade" },
  { value: "folha", label: "Folha(s)", category: "Unidade" },
  { value: "g", label: "Gramas (g)", category: "Peso" },
  { value: "grama", label: "Grama (grama)", category: "Peso" },
  { value: "lata", label: "Lata(s)", category: "Recipiente" },
  { value: "l", label: "Litros (l)", category: "Volume" },
  { value: "maço", label: "Maço(s)", category: "Unidade" },
  { value: "mg", label: "Miligramas (mg)", category: "Peso" },
  { value: "ml", label: "Mililitros (ml)", category: "Volume" },
  { value: "mm", label: "Milímetro(s) (mm)", category: "Medida" },
  { value: "pacote", label: "Pacote(s)", category: "Recipiente" },
  { value: "pedaço", label: "Pedaço(s)", category: "Unidade" },
  { value: "pitada", label: "Pitada(s)", category: "Geral" },
  { value: "porção", label: "Porção (porção)", category: "Geral" },
  { value: "kg", label: "Quilogramas (kg)", category: "Peso" },
  { value: "ramo", label: "Ramo(s)", category: "Unidade" },
  { value: "unidade", label: "Unidade(s)", category: "Unidade" },
  { value: "vidro", label: "Vidro(s)", category: "Recipiente" },
  { value: "xícara", label: "Xícara(s)", category: "Xícaras e Copos" },
  { value: "xícara de chá", label: "Xícara(s) de chá", category: "Xícaras e Copos" }
]

/**
 * Hook for consuming active ingredient measurement units in forms and editors
 */
export function useMeasurementUnits() {
  const query = useQuery({
    queryKey: ['measurement-units'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('measurement_units')
        .select('name, symbol, category, sort_order')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true })

      if (error) {
        console.warn('Could not load measurement units from DB, using fallback list:', error.message)
        return FALLBACK_INGREDIENT_UNITS
      }

      if (!data || data.length === 0) {
        return FALLBACK_INGREDIENT_UNITS
      }

      return data.map(item => ({
        value: item.symbol,
        label: item.name,
        category: item.category
      })) as IngredientUnitOption[]
    },
    staleTime: 1000 * 60 * 10, // 10 minutes cache
  })

  return {
    units: query.data || FALLBACK_INGREDIENT_UNITS,
    isLoading: query.isLoading
  }
}
