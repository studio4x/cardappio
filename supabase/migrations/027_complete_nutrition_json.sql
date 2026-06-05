-- ============================================================
-- CARDAPPIO — Migration 027: Complete ANVISA Nutrition Column
-- ============================================================
-- Adds the `nutrition_info` JSONB column to the recipes table.
-- This column stores the complete nutritional breakdown, serving size
-- and percent daily values for the 10 core nutrients.

ALTER TABLE public.recipes
  ADD COLUMN IF NOT EXISTS nutrition_info JSONB DEFAULT NULL;

COMMENT ON COLUMN public.recipes.nutrition_info IS 'Tabela nutricional completa em formato JSONB, seguindo o padrão ANVISA (100g/ml, porção e %VD)';
