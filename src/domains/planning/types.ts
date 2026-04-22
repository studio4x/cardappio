// ============================================
// Planning Domain Types
// ============================================

export type WeekStatus = 'draft' | 'active' | 'archived'
export type MealType = 'lunch' | 'dinner'
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'

export interface MealPlanWeek {
  id: string
  user_id: string
  title: string | null
  week_start_date: string
  week_end_date: string
  status: WeekStatus
  is_template: boolean
  source_week_id: string | null
  created_at: string
  updated_at: string
  // Joined
  days?: MealPlanDay[]
}

export interface MealPlanDay {
  id: string
  week_id: string
  day_of_week: DayOfWeek
  date_reference: string | null
  sort_order: number
  created_at: string
  // Joined
  slots?: MealPlanSlot[]
}

export interface MealPlanSlot {
  id: string
  day_id: string
  meal_type: MealType
  recipe_id: string | null
  sort_order: number
  created_at: string
  updated_at: string
  // Joined
  recipe?: import('../recipes/types').Recipe
}
