-- ============================================================
-- CARDAPPIO — Migration 024: Add unit to recipe_ingredients
-- ============================================================

ALTER TABLE recipe_ingredients ADD COLUMN unit TEXT;
