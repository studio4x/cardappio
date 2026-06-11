-- ============================================================
-- CARDAPPIO — Migration 030: Allow Select Premium Recipes
-- ============================================================
-- Updates the RLS policy "recipes_select_access" on public.recipes
-- to allow all authenticated users to select premium recipes,
-- so they can appear in the recipes grid for everyone.
-- ============================================================

DROP POLICY IF EXISTS "recipes_select_access" ON public.recipes;

CREATE POLICY "recipes_select_access"
  ON public.recipes FOR SELECT
  USING (
    (auth.uid() IS NOT NULL AND status = 'published')
    OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'super_admin')
    )
  );
