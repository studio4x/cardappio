// ============================================
// Shopping Domain Types
// ============================================

export type ShoppingListStatus = 'active' | 'archived'

export interface ShoppingList {
  id: string
  user_id: string
  week_id: string
  status: ShoppingListStatus
  generated_at: string | null
  created_at: string
  updated_at: string
  // Joined
  items?: ShoppingListItem[]
}

export interface ShoppingListItem {
  id: string
  shopping_list_id: string
  ingredient_label: string
  normalized_name: string | null
  quantity_label: string | null
  source_recipe_count: number
  is_checked: boolean
  sort_order: number
  created_at: string
  updated_at: string
}
