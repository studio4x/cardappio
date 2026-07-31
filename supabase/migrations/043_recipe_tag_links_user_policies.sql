-- ============================================================
-- CARDAPPIO — Migration 043: User Recipe Tag Links Policies
-- ============================================================
-- Allows users to manage (insert/delete) their own recipe tags.
-- ============================================================

CREATE POLICY "recipe_tag_links_insert_own"
  ON public.recipe_tag_links FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.recipes r
      WHERE r.id = recipe_id
      AND r.created_by = auth.uid()
    )
  );

CREATE POLICY "recipe_tag_links_delete_own"
  ON public.recipe_tag_links FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.recipes r
      WHERE r.id = recipe_id
      AND r.created_by = auth.uid()
    )
  );
