-- ============================================================
-- CARDAPPIO — Migration 025: Nutritional Fields on Recipes
-- ============================================================
-- Adds per-serving nutritional data columns to the recipes table.
-- Values are populated by the AI generation Edge Function or manually by admin.

ALTER TABLE public.recipes
  ADD COLUMN IF NOT EXISTS calories_per_serving  NUMERIC(8, 2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS protein_per_serving   NUMERIC(8, 2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS fat_per_serving       NUMERIC(8, 2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS carbs_per_serving     NUMERIC(8, 2) DEFAULT NULL;

COMMENT ON COLUMN public.recipes.calories_per_serving IS 'Calorias por porção (kcal), gerado via IA ou preenchido manualmente';
COMMENT ON COLUMN public.recipes.protein_per_serving  IS 'Proteínas por porção (g), gerado via IA ou preenchido manualmente';
COMMENT ON COLUMN public.recipes.fat_per_serving      IS 'Gorduras totais por porção (g), gerado via IA ou preenchido manualmente';
COMMENT ON COLUMN public.recipes.carbs_per_serving    IS 'Carboidratos por porção (g), gerado via IA ou preenchido manualmente';
