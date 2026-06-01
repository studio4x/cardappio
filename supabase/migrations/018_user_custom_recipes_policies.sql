-- ============================================================
-- CARDAPPIO — Migration 018: User Custom Recipes Policies
-- ============================================================
-- Allows users to manage (CRUD) their own custom recipes,
-- including their child elements (ingredients and steps).
-- ============================================================

-- 1. Policies for public.recipes
CREATE POLICY "recipes_select_own"
  ON public.recipes FOR SELECT
  USING (auth.uid() = created_by);

CREATE POLICY "recipes_insert_own"
  ON public.recipes FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "recipes_update_own"
  ON public.recipes FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "recipes_delete_own"
  ON public.recipes FOR DELETE
  USING (auth.uid() = created_by);

-- 2. Policies for public.recipe_ingredients
-- We check if the parent recipe belongs to the user
CREATE POLICY "recipe_ingredients_insert_own"
  ON public.recipe_ingredients FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.recipes r
      WHERE r.id = recipe_id
      AND r.created_by = auth.uid()
    )
  );

CREATE POLICY "recipe_ingredients_update_own"
  ON public.recipe_ingredients FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.recipes r
      WHERE r.id = recipe_id
      AND r.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.recipes r
      WHERE r.id = recipe_id
      AND r.created_by = auth.uid()
    )
  );

CREATE POLICY "recipe_ingredients_delete_own"
  ON public.recipe_ingredients FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.recipes r
      WHERE r.id = recipe_id
      AND r.created_by = auth.uid()
    )
  );

-- 3. Policies for public.recipe_steps
CREATE POLICY "recipe_steps_insert_own"
  ON public.recipe_steps FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.recipes r
      WHERE r.id = recipe_id
      AND r.created_by = auth.uid()
    )
  );

CREATE POLICY "recipe_steps_update_own"
  ON public.recipe_steps FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.recipes r
      WHERE r.id = recipe_id
      AND r.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.recipes r
      WHERE r.id = recipe_id
      AND r.created_by = auth.uid()
    )
  );

CREATE POLICY "recipe_steps_delete_own"
  ON public.recipe_steps FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.recipes r
      WHERE r.id = recipe_id
      AND r.created_by = auth.uid()
    )
  );
