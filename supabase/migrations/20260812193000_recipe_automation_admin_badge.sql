-- ============================================================
-- CARDAPPIO — Automation-created recipe admin badge
-- ============================================================
-- Adds provenance metadata to recipes without mixing operational metadata
-- with recipe taxonomies. Existing successful n8n imports are backfilled,
-- and future successful imports are marked by a trigger on the internal
-- recipe_import_runs ledger.

ALTER TABLE public.recipes
  ADD COLUMN IF NOT EXISTS is_automation_created BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.recipes.is_automation_created IS
  'True when the recipe was created through the server-side recipe import automation. Intended for admin provenance UI only.';

-- Backfill every recipe that already has a successful import ledger entry.
UPDATE public.recipes r
SET is_automation_created = true
WHERE r.is_automation_created = false
  AND EXISTS (
    SELECT 1
    FROM public.recipe_import_runs rir
    WHERE rir.recipe_id = r.id
      AND rir.status = 'succeeded'
  );

CREATE OR REPLACE FUNCTION public.mark_recipe_automation_created_v1()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.status = 'succeeded' AND NEW.recipe_id IS NOT NULL THEN
    UPDATE public.recipes
    SET is_automation_created = true
    WHERE id = NEW.recipe_id
      AND is_automation_created = false;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_recipe_automation_created_v1()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_recipe_automation_created_v1()
  TO service_role;

DROP TRIGGER IF EXISTS trg_recipe_import_runs_mark_automation_recipe
  ON public.recipe_import_runs;

CREATE TRIGGER trg_recipe_import_runs_mark_automation_recipe
  AFTER INSERT OR UPDATE OF status, recipe_id
  ON public.recipe_import_runs
  FOR EACH ROW
  WHEN (NEW.status = 'succeeded' AND NEW.recipe_id IS NOT NULL)
  EXECUTE FUNCTION public.mark_recipe_automation_created_v1();
