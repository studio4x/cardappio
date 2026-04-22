// ============================================
// Auth Types
// ============================================

export type UserRole = 'user' | 'admin' | 'super_admin'
export type UserStatus = 'active' | 'inactive' | 'suspended'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole
  status: UserStatus
  last_seen_at: string | null
  onboarding_completed_at: string | null
  created_at: string
  updated_at: string
}

export interface UserPreferences {
  id: string
  user_id: string
  household_size: number
  default_meal_modes: string[] // ['lunch', 'dinner']
  default_plan_days: number
  dietary_preferences: string[]
  dietary_restrictions: string[]
  primary_goal: string | null
  preferred_recipe_contexts: string[]
  quiet_hours_enabled: boolean
  created_at: string
  updated_at: string
}

export interface AuthState {
  user: Profile | null
  preferences: UserPreferences | null
  isLoading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  hasCompletedOnboarding: boolean
}
