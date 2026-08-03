-- ============================================================
-- CARDAPPIO — Migration 044: Recipe Ingredient Linked Recipe
-- ============================================================
-- Adds optional linked_recipe_id to recipe_ingredients so
-- an ingredient can reference another recipe as a base/source.
-- ============================================================

ALTER TABLE recipe_ingredients
  ADD COLUMN IF NOT EXISTS linked_recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_linked_recipe
  ON recipe_ingredients(linked_recipe_id)
  WHERE linked_recipe_id IS NOT NULL;
