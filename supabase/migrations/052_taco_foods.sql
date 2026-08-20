-- ============================================================
-- CARDAPPIO — Migration 052: TACO Foods Database Table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.taco_foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  food_number INT UNIQUE,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  humidity_pct NUMERIC,
  energy_kcal NUMERIC NOT NULL,
  energy_kj NUMERIC,
  protein_g NUMERIC,
  lipid_g NUMERIC,
  cholesterol_mg NUMERIC,
  carbohydrate_g NUMERIC,
  fiber_g NUMERIC,
  ash_g NUMERIC,
  calcium_mg NUMERIC,
  magnesium_mg NUMERIC,
  manganese_mg NUMERIC,
  phosphorus_mg NUMERIC,
  iron_mg NUMERIC,
  sodium_mg NUMERIC,
  potassium_mg NUMERIC,
  copper_mg NUMERIC,
  zinc_mg NUMERIC,
  retinol_mcg NUMERIC,
  thiamine_mg NUMERIC,
  riboflavin_mg NUMERIC,
  pyridoxine_mg NUMERIC,
  niacin_mg NUMERIC,
  vit_c_mg NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_taco_foods_description ON public.taco_foods USING gin (to_tsvector('portuguese', description));
CREATE INDEX IF NOT EXISTS idx_taco_foods_number ON public.taco_foods(food_number);

-- Enable RLS
ALTER TABLE public.taco_foods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "taco_foods_select_public" ON public.taco_foods;
CREATE POLICY "taco_foods_select_public"
  ON public.taco_foods FOR SELECT USING (true);

DROP POLICY IF EXISTS "taco_foods_admin_all" ON public.taco_foods;
CREATE POLICY "taco_foods_admin_all"
  ON public.taco_foods FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));
