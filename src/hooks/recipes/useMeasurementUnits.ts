import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export interface IngredientUnitOption {
  value: string
  label: string
  category?: string | null
}

export const DEFAULT_MEASUREMENT_UNITS_DATA = [
  { symbol: "a gosto", name: "A gosto", category: "Geral", sort_order: 1 },
  { symbol: "caixa", name: "Caixa(s)", category: "Recipiente", sort_order: 2 },
  { symbol: "centilitro", name: "Centilitro (centilitro)", category: "Volume", sort_order: 3 },
  { symbol: "centilitros", name: "Centilitros (centilitros)", category: "Volume", sort_order: 4 },
  { symbol: "cl", name: "Centilitros (cl)", category: "Volume", sort_order: 5 },
  { symbol: "centímetro", name: "Centímetro (centímetro)", category: "Medida", sort_order: 6 },
  { symbol: "centímetros", name: "Centímetros (centímetros)", category: "Medida", sort_order: 7 },
  { symbol: "cm", name: "Centímetro(s) (cm)", category: "Medida", sort_order: 8 },
  { symbol: "colher (café)", name: "Colher (café)", category: "Colheres", sort_order: 9 },
  { symbol: "colher (chá)", name: "Colher (chá)", category: "Colheres", sort_order: 10 },
  { symbol: "colher (sobremesa)", name: "Colher (sobremesa)", category: "Colheres", sort_order: 11 },
  { symbol: "colher (sopa)", name: "Colher (sopa)", category: "Colheres", sort_order: 12 },
  { symbol: "colher de café", name: "Colher(es) de café", category: "Colheres", sort_order: 13 },
  { symbol: "colher de chá", name: "Colher(es) de chá", category: "Colheres", sort_order: 14 },
  { symbol: "colher de sobremesa", name: "Colher(es) de sobremesa", category: "Colheres", sort_order: 15 },
  { symbol: "colher de sopa", name: "Colher(es) de sopa", category: "Colheres", sort_order: 16 },
  { symbol: "colheres (café)", name: "Colheres (café)", category: "Colheres", sort_order: 17 },
  { symbol: "colheres (chá)", name: "Colheres (chá)", category: "Colheres", sort_order: 18 },
  { symbol: "colheres (sobremesa)", name: "Colheres (sobremesa)", category: "Colheres", sort_order: 19 },
  { symbol: "colheres (sopa)", name: "Colheres (sopa)", category: "Colheres", sort_order: 20 },
  { symbol: "copo", name: "Copo(s)", category: "Xícaras e Copos", sort_order: 21 },
  { symbol: "decilitro", name: "Decilitro (decilitro)", category: "Volume", sort_order: 22 },
  { symbol: "decilitros", name: "Decilitros (decilitros)", category: "Volume", sort_order: 23 },
  { symbol: "dl", name: "Decilitros (dl)", category: "Volume", sort_order: 24 },
  { symbol: "dente", name: "Dente(s)", category: "Unidade", sort_order: 25 },
  { symbol: "dentes", name: "Dentes (dentes)", category: "Unidade", sort_order: 26 },
  { symbol: "fatia", name: "Fatia(s)", category: "Unidade", sort_order: 27 },
  { symbol: "fatias", name: "Fatias (fatias)", category: "Unidade", sort_order: 28 },
  { symbol: "folha", name: "Folha(s)", category: "Unidade", sort_order: 29 },
  { symbol: "folhas", name: "Folhas (folhas)", category: "Unidade", sort_order: 30 },
  { symbol: "grama", name: "Grama (grama)", category: "Peso", sort_order: 31 },
  { symbol: "g", name: "Gramas (g)", category: "Peso", sort_order: 32 },
  { symbol: "gramas", name: "Gramas (gramas)", category: "Peso", sort_order: 33 },
  { symbol: "lata", name: "Lata(s)", category: "Recipiente", sort_order: 34 },
  { symbol: "liter", name: "Liter (liter)", category: "Volume", sort_order: 35 },
  { symbol: "l", name: "Litros (l)", category: "Volume", sort_order: 36 },
  { symbol: "litros", name: "Litros (litros)", category: "Volume", sort_order: 37 },
  { symbol: "maço", name: "Maço(s)", category: "Unidade", sort_order: 38 },
  { symbol: "milligrama", name: "Miligrama (milligrama)", category: "Peso", sort_order: 39 },
  { symbol: "mg", name: "Miligramas (mg)", category: "Peso", sort_order: 40 },
  { symbol: "milligramas", name: "Miligramas (milligramas)", category: "Peso", sort_order: 41 },
  { symbol: "millilitro", name: "Mililitro (millilitro)", category: "Volume", sort_order: 42 },
  { symbol: "millilitros", name: "Mililitros (millilitros)", category: "Volume", sort_order: 43 },
  { symbol: "ml", name: "Mililitros (ml)", category: "Volume", sort_order: 44 },
  { symbol: "milímetro", name: "Milímetro (milímetro)", category: "Medida", sort_order: 45 },
  { symbol: "milímetros", name: "Milímetros (milímetros)", category: "Medida", sort_order: 46 },
  { symbol: "mm", name: "Milímetro(s) (mm)", category: "Medida", sort_order: 47 },
  { symbol: "molho", name: "Molho (molho)", category: "Unidade", sort_order: 48 },
  { symbol: "molhos", name: "Molhos (molhos)", category: "Unidade", sort_order: 49 },
  { symbol: "pacote", name: "Pacote(s)", category: "Recipiente", sort_order: 50 },
  { symbol: "pedaço", name: "Pedaço(s)", category: "Unidade", sort_order: 51 },
  { symbol: "pedaços", name: "Pedaços (pedaços)", category: "Unidade", sort_order: 52 },
  { symbol: "pitada", name: "Pitada(s)", category: "Geral", sort_order: 53 },
  { symbol: "porção", name: "Porção (porção)", category: "Geral", sort_order: 54 },
  { symbol: "quilo", name: "Quilo (quilo)", category: "Peso", sort_order: 55 },
  { symbol: "kg", name: "Quilogramas (kg)", category: "Peso", sort_order: 56 },
  { symbol: "quilos", name: "Quilos (quilos)", category: "Peso", sort_order: 57 },
  { symbol: "ramo", name: "Ramo(s)", category: "Unidade", sort_order: 58 },
  { symbol: "unidade", name: "Unidade(s)", category: "Unidade", sort_order: 59 },
  { symbol: "vidro", name: "Vidro(s)", category: "Recipiente", sort_order: 60 },
  { symbol: "xícara", name: "Xícara(s)", category: "Xícaras e Copos", sort_order: 61 },
  { symbol: "xícaras", name: "Xícaras (xícaras)", category: "Xícaras e Copos", sort_order: 62 },
  { symbol: "xícara de chá", name: "Xícara(s) de chá", category: "Xícaras e Copos", sort_order: 63 }
]

export const FALLBACK_INGREDIENT_UNITS: IngredientUnitOption[] = DEFAULT_MEASUREMENT_UNITS_DATA.map(item => ({
  value: item.symbol,
  label: item.name,
  category: item.category
}))

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
