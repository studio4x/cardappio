import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export interface RecipeNutritionFilters {
  categoryId?: string
  search?: string
  onlyPending?: boolean
  page?: number
  pageSize?: number
}

export interface RecipePendingNutrition {
  id: string
  title: string
  status: string
  created_at: string
  nutrition_info: any
  category?: {
    name: string
    slug: string
  } | null
  ingredients: { id: string }[]
}

export function useRecipeNutritionBatch(filters: RecipeNutritionFilters) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['recipes-pending-nutrition', filters],
    queryFn: async () => {
      const page = filters.page || 1
      const pageSize = filters.pageSize || 15
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      let dbQuery = supabase
        .from('recipes')
        .select(`
          id,
          title,
          status,
          created_at,
          nutrition_info,
          category:recipe_categories(name, slug),
          ingredients:recipe_ingredients!recipe_ingredients_recipe_id_fkey(id)
        `, { count: 'exact' })

      if (filters.onlyPending !== false) {
        dbQuery = dbQuery.is('nutrition_info', null)
      }

      if (filters.categoryId) {
        dbQuery = dbQuery.eq('category_id', filters.categoryId)
      }

      if (filters.search) {
        dbQuery = dbQuery.ilike('title', `%${filters.search}%`)
      }

      // Order by created_at desc
      dbQuery = dbQuery.order('created_at', { ascending: false })

      // Range pagination
      dbQuery = dbQuery.range(from, to)

      const { data, count, error } = await dbQuery

      if (error) throw error

      return {
        recipes: (data || []) as unknown as RecipePendingNutrition[],
        total: count || 0
      }
    }
  })

  // Mutation to generate nutrition table for a single recipe
  const generateNutritionMutation = useMutation({
    mutationFn: async (recipeId: string) => {
      // 1. Fetch recipe ingredients and servings
      const { data: recipe, error: recipeErr } = await supabase
        .from('recipes')
        .select(`
          title,
          servings,
          ingredients:recipe_ingredients(name, quantity_label, unit)
        `)
        .eq('id', recipeId)
        .single()

      if (recipeErr || !recipe) {
        throw new Error(recipeErr?.message || 'Receita não encontrada')
      }

      if (!recipe.ingredients || recipe.ingredients.length === 0) {
        throw new Error('A receita não possui ingredientes cadastrados.')
      }

      // 2. Call generate-nutrition edge function
      const { data: result, error: funcErr } = await supabase.functions.invoke('generate-nutrition', {
        body: {
          ingredients: recipe.ingredients,
          servings: recipe.servings || 1
        }
      })

      if (funcErr) throw funcErr
      if (result?.error) throw new Error(result.error.message || 'Erro na geração da tabela')

      // 3. Save the results back to the recipe
      const info = result.data
      const nutrients = info.nutrients
      const calories = nutrients.energy_kcal.per_serving
      const protein = nutrients.protein.per_serving
      const fat = nutrients.fat.per_serving
      const carbs = nutrients.carbs.per_serving

      const { error: updateErr } = await supabase
        .from('recipes')
        .update({
          nutrition_info: info,
          calories_per_serving: calories,
          protein_per_serving: protein,
          fat_per_serving: fat,
          carbs_per_serving: carbs,
          updated_at: new Date().toISOString()
        })
        .eq('id', recipeId)

      if (updateErr) throw updateErr

      return { recipeId, title: recipe.title, success: true }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes-pending-nutrition'] })
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
      queryClient.invalidateQueries({ queryKey: ['recipe'] })
    }
  })

  return {
    ...query,
    generateNutritionMutation
  }
}
