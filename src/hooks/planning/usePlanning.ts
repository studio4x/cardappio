import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/app/providers/AuthProvider'
import type { MealPlanWeek, MealPlanDay, MealPlanSlot, DayOfWeek } from '@/types/planning'

const DAYS_ORDER: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

/**
 * Fetch active week for the current user.
 * Per CODEX_CARDAPPIO_APP_SPEC.md: the center of the product is the weekly plan.
 */
export function useActiveWeek() {
  const { supabaseUser } = useAuth()

  return useQuery({
    queryKey: ['active-week', supabaseUser?.id],
    queryFn: async () => {
      if (!supabaseUser) return null

      const { data, error } = await supabase
        .from('meal_plan_weeks')
        .select(`
          *,
          days:meal_plan_days(
            *,
            slots:meal_plan_slots(
              *,
              recipe:recipes(id, slug, title, cover_image_url, prep_time_minutes, difficulty_level, servings)
            )
          )
        `)
        .eq('user_id', supabaseUser.id)
        .eq('status', 'active')
        .order('week_start_date', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return (data as MealPlanWeek) ?? null
    },
    enabled: !!supabaseUser,
  })
}

/**
 * Fetch a specific week by ID.
 */
export function useWeek(weekId: string | undefined) {
  return useQuery({
    queryKey: ['week', weekId],
    queryFn: async () => {
      if (!weekId) return null

      const { data, error } = await supabase
        .from('meal_plan_weeks')
        .select(`
          *,
          days:meal_plan_days(
            *,
            slots:meal_plan_slots(
              *,
              recipe:recipes(id, slug, title, cover_image_url, prep_time_minutes, difficulty_level, servings)
            )
          )
        `)
        .eq('id', weekId)
        .single()

      if (error) throw error
      return data as MealPlanWeek
    },
    enabled: !!weekId,
  })
}

/**
 * Create a new week with days and empty slots.
 * Per spec: user selects days and meal modes, then we scaffold the structure.
 */
export function useCreateWeek() {
  const queryClient = useQueryClient()
  const { supabaseUser } = useAuth()

  return useMutation({
    mutationFn: async ({
      startDate,
      endDate,
      selectedDays,
      mealModes,
    }: {
      startDate: string
      endDate: string
      selectedDays: DayOfWeek[]
      mealModes: string[]
    }) => {
      if (!supabaseUser) throw new Error('Not authenticated')

      // 1. Archive any existing active week
      await supabase
        .from('meal_plan_weeks')
        .update({ status: 'archived' })
        .eq('user_id', supabaseUser.id)
        .eq('status', 'active')

      // 2. Create the week
      const { data: week, error: weekError } = await supabase
        .from('meal_plan_weeks')
        .insert({
          user_id: supabaseUser.id,
          week_start_date: startDate,
          week_end_date: endDate,
          status: 'active',
        })
        .select()
        .single()

      if (weekError) throw weekError

      // 3. Create days
      const daysToInsert = selectedDays.map((day, i) => ({
        week_id: week.id,
        day_of_week: day,
        sort_order: DAYS_ORDER.indexOf(day),
      }))

      const { data: days, error: daysError } = await supabase
        .from('meal_plan_days')
        .insert(daysToInsert)
        .select()

      if (daysError) throw daysError

      // 4. Create empty slots for each day/meal_type
      const slotsToInsert = (days as MealPlanDay[]).flatMap((day) =>
        mealModes.map((mealType, i) => ({
          day_id: day.id,
          meal_type: mealType,
          sort_order: i,
        }))
      )

      const { error: slotsError } = await supabase
        .from('meal_plan_slots')
        .insert(slotsToInsert)

      if (slotsError) throw slotsError

      return week as MealPlanWeek
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-week'] })
    },
  })
}

/**
 * Assign a recipe to a slot.
 */
export function useAssignRecipe() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      slotId,
      recipeId,
    }: {
      slotId: string
      recipeId: string | null
    }) => {
      const { error } = await supabase
        .from('meal_plan_slots')
        .update({ recipe_id: recipeId })
        .eq('id', slotId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-week'] })
      queryClient.invalidateQueries({ queryKey: ['week'] })
    },
  })
}

/**
 * Repeat (duplicate) an existing week plan.
 */
export function useRepeatWeek() {
  const queryClient = useQueryClient()
  const { supabaseUser } = useAuth()

  return useMutation({
    mutationFn: async (sourceWeekId: string) => {
      if (!supabaseUser) throw new Error('Not authenticated')

      // 1. Fetch source structure
      const { data: sourceWeek, error: fetchError } = await supabase
        .from('meal_plan_weeks')
        .select(`
          *,
          days:meal_plan_days(
            *,
            slots:meal_plan_slots(*)
          )
        `)
        .eq('id', sourceWeekId)
        .single()

      if (fetchError) throw fetchError

      // 2. Archive any existing active week
      await supabase
        .from('meal_plan_weeks')
        .update({ status: 'archived' })
        .eq('user_id', supabaseUser.id)
        .eq('status', 'active')

      // 3. Create the new week (dates shift logic could be complex, for now we set today as start)
      const startDate = new Date().toISOString().split('T')[0]
      const endDate = new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      const { data: newWeek, error: weekError } = await supabase
        .from('meal_plan_weeks')
        .insert({
          user_id: supabaseUser.id,
          title: `${sourceWeek.title || 'Semana'} (Repetida)`,
          week_start_date: startDate,
          week_end_date: endDate,
          status: 'active',
          source_week_id: sourceWeekId,
        })
        .select()
        .single()

      if (weekError) throw weekError

      // 4. Duplicate days and slots
      for (const day of sourceWeek.days || []) {
        const { data: newDay, error: dayError } = await supabase
          .from('meal_plan_days')
          .insert({
            week_id: newWeek.id,
            day_of_week: day.day_of_week,
            sort_order: day.sort_order,
          })
          .select()
          .single()
        
        if (dayError) throw dayError

        if (day.slots?.length > 0) {
          const slotsToInsert = day.slots.map((s: any) => ({
            day_id: newDay.id,
            meal_type: s.meal_type,
            recipe_id: s.recipe_id,
            sort_order: s.sort_order,
          }))

          const { error: slotsError } = await supabase
            .from('meal_plan_slots')
            .insert(slotsToInsert)
          
          if (slotsError) throw slotsError
        }
      }

      return newWeek
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-week'] })
      queryClient.invalidateQueries({ queryKey: ['meal-weeks-history'] })
    }
  })
}
