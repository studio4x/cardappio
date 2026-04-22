// ============================================
// Recipe Domain Types
// ============================================

export type RecipeStatus = 'draft' | 'published' | 'archived'
export type DifficultyLevel = 'easy' | 'medium' | 'hard'
export type CostLevel = 'low' | 'medium' | 'high'

export interface RecipeCategory {
  id: string
  name: string
  slug: string
  description: string | null
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface RecipeTag {
  id: string
  name: string
  slug: string
  tag_type: string
  is_active: boolean
  created_at: string
}

export interface RecipeVariation {
  id: string
  parent_recipe_id: string
  variation_title: string
  variation_notes: string | null
  linked_recipe_id: string | null
  created_at: string
  updated_at: string
  linked_recipe?: Recipe
}

export interface Recipe {
  id: string
  slug: string
  title: string
  subtitle: string | null
  cover_image_url: string | null
  difficulty_level: DifficultyLevel
  cost_level: CostLevel
  prep_time_minutes: number
  servings: number
  category_id: string | null
  usage_context: string | null
  notes: string | null
  status: RecipeStatus
  is_featured: boolean
  is_premium: boolean
  published_at: string | null
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
  // Joined fields
  category?: RecipeCategory
  ingredients?: RecipeIngredient[]
  steps?: RecipeStep[]
  tags?: RecipeTag[]
  variations?: RecipeVariation[]
}

export interface RecipeIngredient {
  id: string
  recipe_id: string
  name: string
  quantity_label: string | null
  normalized_name: string | null
  sort_order: number
  is_optional: boolean
  created_at: string
}

export interface RecipeStep {
  id: string
  recipe_id: string
  step_number: number
  content: string
  created_at: string
}
