-- ============================================================
-- CARDAPPIO — Recipe automation admin control
-- ============================================================
-- n8n owns scheduling/orchestration. PostgreSQL stores configuration,
-- atomically claims execution slots and records compact operational history.
-- No pg_cron job is created by this migration.

INSERT INTO public.app_settings (setting_key, value_json, description)
VALUES (
  'recipe_automation_config',
  '{"version":1,"enabled":false,"timezone":"America/Sao_Paulo","targets":[],"schedule":{"days_of_week":[1],"time":"07:15"}}'::jsonb,
  'Configuração administrativa da automação n8n de criação de rascunhos de receitas'
)
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO public.app_settings (setting_key, value_json, description)
VALUES (
  'recipe_automation_runtime',
  '{"version":1}'::jsonb,
  'Estado operacional interno da automação n8n de criação de rascunhos de receitas'
)
ON CONFLICT (setting_key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.request_recipe_automation_manual_run_v1(p_requested_by UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_config JSONB;
  v_runtime JSONB;
  v_request_id UUID := gen_random_uuid();
  v_targets JSONB;
  v_total INTEGER := 0;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('recipe-automation-runtime', 0));
  SELECT value_json INTO v_config FROM public.app_settings WHERE setting_key = 'recipe_automation_config' FOR UPDATE;
  SELECT value_json INTO v_runtime FROM public.app_settings WHERE setting_key = 'recipe_automation_runtime' FOR UPDATE;

  IF v_config IS NULL OR v_runtime IS NULL THEN
    RAISE EXCEPTION 'recipe_automation_settings_missing' USING ERRCODE = '22023';
  END IF;

  v_targets := COALESCE(v_config->'targets', '[]'::jsonb);
  IF jsonb_typeof(v_targets) <> 'array' OR jsonb_array_length(v_targets) = 0 THEN
    RAISE EXCEPTION 'recipe_automation_targets_empty' USING ERRCODE = '22023';
  END IF;

  BEGIN
    SELECT COALESCE(sum((target->>'quantity')::INTEGER), 0)
      INTO v_total
    FROM jsonb_array_elements(v_targets) AS target;
  EXCEPTION WHEN invalid_text_representation OR numeric_value_out_of_range THEN
    RAISE EXCEPTION 'recipe_automation_invalid_quantity' USING ERRCODE = '22023';
  END;

  IF v_total NOT BETWEEN 1 AND 20 THEN
    RAISE EXCEPTION 'recipe_automation_total_out_of_range' USING ERRCODE = '22023';
  END IF;

  IF v_runtime ? 'manual_request' THEN
    RETURN jsonb_build_object('accepted', false, 'reason', 'manual_request_already_pending', 'request', v_runtime->'manual_request');
  END IF;

  v_runtime := v_runtime || jsonb_build_object(
    'manual_request', jsonb_build_object('id', v_request_id, 'requested_at', now(), 'requested_by', p_requested_by),
    'updated_at', now()
  );

  UPDATE public.app_settings
  SET value_json = v_runtime, updated_at = now(), updated_by = p_requested_by
  WHERE setting_key = 'recipe_automation_runtime';

  RETURN jsonb_build_object('accepted', true, 'request_id', v_request_id, 'requested_at', now());
END;
$$;

REVOKE ALL ON FUNCTION public.request_recipe_automation_manual_run_v1(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.request_recipe_automation_manual_run_v1(UUID) TO service_role;

CREATE OR REPLACE FUNCTION public.claim_recipe_automation_run_v1()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_config JSONB;
  v_runtime JSONB;
  v_targets JSONB;
  v_target JSONB;
  v_total INTEGER := 0;
  v_qty INTEGER;
  v_slug TEXT;
  v_timezone TEXT;
  v_enabled BOOLEAN := false;
  v_days JSONB;
  v_schedule_time TIME;
  v_local_now TIMESTAMP;
  v_local_dow INTEGER;
  v_slot_key TEXT;
  v_manual JSONB;
  v_trigger TEXT;
  v_run_id UUID := gen_random_uuid();
  v_active_run UUID;
  v_active_started TIMESTAMPTZ;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('recipe-automation-runtime', 0));
  SELECT value_json INTO v_config FROM public.app_settings WHERE setting_key = 'recipe_automation_config' FOR UPDATE;
  SELECT value_json INTO v_runtime FROM public.app_settings WHERE setting_key = 'recipe_automation_runtime' FOR UPDATE;

  IF v_config IS NULL OR v_runtime IS NULL THEN
    RETURN jsonb_build_object('claimed', false, 'reason', 'settings_missing');
  END IF;

  BEGIN v_active_run := NULLIF(v_runtime->>'active_run_id', '')::UUID;
  EXCEPTION WHEN invalid_text_representation THEN v_active_run := NULL; END;
  BEGIN v_active_started := NULLIF(v_runtime->>'active_run_started_at', '')::TIMESTAMPTZ;
  EXCEPTION WHEN invalid_text_representation THEN v_active_started := NULL; END;

  IF v_active_run IS NOT NULL AND v_active_started IS NOT NULL
     AND v_active_started >= now() - interval '2 hours' THEN
    RETURN jsonb_build_object('claimed', false, 'reason', 'active_run', 'active_run_id', v_active_run, 'active_run_started_at', v_active_started);
  END IF;

  IF v_active_run IS NOT NULL THEN
    INSERT INTO public.cron_execution_logs(job_name, status, processed_count, metadata_json)
    VALUES ('recipe_automation', 'stale', 0, jsonb_build_object('run_id', v_active_run, 'started_at', v_active_started, 'released_at', now()));
    v_runtime := v_runtime - 'active_run_id' - 'active_run_started_at' - 'active_trigger' - 'active_slot_key';
  END IF;

  v_targets := COALESCE(v_config->'targets', '[]'::jsonb);
  IF jsonb_typeof(v_targets) <> 'array' OR jsonb_array_length(v_targets) = 0 THEN
    RETURN jsonb_build_object('claimed', false, 'reason', 'targets_empty');
  END IF;

  FOR v_target IN SELECT value FROM jsonb_array_elements(v_targets)
  LOOP
    v_slug := btrim(COALESCE(v_target->>'category_slug', ''));
    BEGIN v_qty := (v_target->>'quantity')::INTEGER;
    EXCEPTION WHEN invalid_text_representation OR numeric_value_out_of_range THEN
      RETURN jsonb_build_object('claimed', false, 'reason', 'invalid_quantity');
    END;

    IF v_slug = '' OR v_qty NOT BETWEEN 1 AND 20 THEN
      RETURN jsonb_build_object('claimed', false, 'reason', 'invalid_target');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.recipe_categories WHERE slug = v_slug AND is_active = true) THEN
      RETURN jsonb_build_object('claimed', false, 'reason', 'inactive_or_unknown_category', 'category_slug', v_slug);
    END IF;
    v_total := v_total + v_qty;
  END LOOP;

  IF v_total NOT BETWEEN 1 AND 20 THEN
    RETURN jsonb_build_object('claimed', false, 'reason', 'total_out_of_range', 'total', v_total);
  END IF;

  v_manual := v_runtime->'manual_request';
  IF v_manual IS NOT NULL AND jsonb_typeof(v_manual) = 'object' AND COALESCE(v_manual->>'id', '') <> '' THEN
    v_trigger := 'manual';
    v_slot_key := 'manual:' || (v_manual->>'id');
  ELSE
    v_enabled := COALESCE((v_config->>'enabled')::BOOLEAN, false);
    IF NOT v_enabled THEN RETURN jsonb_build_object('claimed', false, 'reason', 'disabled'); END IF;

    v_timezone := COALESCE(NULLIF(v_config->>'timezone', ''), 'America/Sao_Paulo');
    IF v_timezone <> 'America/Sao_Paulo' THEN RETURN jsonb_build_object('claimed', false, 'reason', 'unsupported_timezone'); END IF;

    v_days := COALESCE(v_config#>'{schedule,days_of_week}', '[]'::jsonb);
    IF jsonb_typeof(v_days) <> 'array' OR jsonb_array_length(v_days) = 0 THEN
      RETURN jsonb_build_object('claimed', false, 'reason', 'schedule_days_empty');
    END IF;

    BEGIN v_schedule_time := (v_config#>>'{schedule,time}')::TIME;
    EXCEPTION WHEN invalid_datetime_format THEN RETURN jsonb_build_object('claimed', false, 'reason', 'invalid_schedule_time'); END;

    v_local_now := timezone(v_timezone, now());
    v_local_dow := extract(dow FROM v_local_now)::INTEGER;
    IF NOT EXISTS (SELECT 1 FROM jsonb_array_elements_text(v_days) AS d(value) WHERE d.value::INTEGER = v_local_dow) THEN
      RETURN jsonb_build_object('claimed', false, 'reason', 'day_not_scheduled');
    END IF;
    IF v_local_now::TIME < v_schedule_time THEN RETURN jsonb_build_object('claimed', false, 'reason', 'before_schedule_time'); END IF;

    v_slot_key := to_char(v_local_now::DATE, 'YYYY-MM-DD') || '@' || to_char(v_schedule_time, 'HH24:MI');
    IF COALESCE(v_runtime->>'last_schedule_slot', '') = v_slot_key THEN
      RETURN jsonb_build_object('claimed', false, 'reason', 'schedule_slot_already_claimed', 'slot_key', v_slot_key);
    END IF;
    v_trigger := 'scheduled';
  END IF;

  v_runtime := v_runtime || jsonb_build_object(
    'active_run_id', v_run_id,
    'active_run_started_at', now(),
    'active_trigger', v_trigger,
    'active_slot_key', v_slot_key,
    'last_claim_at', now(),
    'updated_at', now()
  );

  IF v_trigger = 'scheduled' THEN
    v_runtime := v_runtime || jsonb_build_object('last_schedule_slot', v_slot_key);
  ELSE
    v_runtime := v_runtime - 'manual_request';
  END IF;

  UPDATE public.app_settings SET value_json = v_runtime, updated_at = now()
  WHERE setting_key = 'recipe_automation_runtime';

  RETURN jsonb_build_object(
    'claimed', true,
    'run_id', v_run_id,
    'trigger_type', v_trigger,
    'slot_key', v_slot_key,
    'targets', v_targets,
    'requested_total', v_total,
    'timezone', COALESCE(v_config->>'timezone', 'America/Sao_Paulo'),
    'config_version', COALESCE((v_config->>'version')::INTEGER, 1)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.claim_recipe_automation_run_v1() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_recipe_automation_run_v1() TO service_role;

CREATE OR REPLACE FUNCTION public.complete_recipe_automation_run_v1(p_run_id UUID, p_status TEXT, p_summary JSONB)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_runtime JSONB;
  v_active_run UUID;
  v_processed INTEGER := 0;
  v_status TEXT := btrim(COALESCE(p_status, ''));
  v_trigger TEXT;
  v_slot TEXT;
  v_started TEXT;
BEGIN
  IF p_run_id IS NULL OR v_status NOT IN ('completed', 'partial', 'failed', 'no_candidates') THEN
    RAISE EXCEPTION 'invalid_run_completion' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended('recipe-automation-runtime', 0));
  SELECT value_json INTO v_runtime FROM public.app_settings WHERE setting_key = 'recipe_automation_runtime' FOR UPDATE;
  IF v_runtime IS NULL THEN RETURN false; END IF;

  BEGIN v_active_run := NULLIF(v_runtime->>'active_run_id', '')::UUID;
  EXCEPTION WHEN invalid_text_representation THEN v_active_run := NULL; END;
  IF v_active_run IS DISTINCT FROM p_run_id THEN RETURN false; END IF;

  BEGIN v_processed := COALESCE((p_summary#>>'{totals,created}')::INTEGER, 0);
  EXCEPTION WHEN invalid_text_representation OR numeric_value_out_of_range THEN v_processed := 0; END;

  v_trigger := v_runtime->>'active_trigger';
  v_slot := v_runtime->>'active_slot_key';
  v_started := v_runtime->>'active_run_started_at';

  INSERT INTO public.cron_execution_logs(job_name, status, processed_count, metadata_json)
  VALUES ('recipe_automation', v_status, v_processed,
    jsonb_build_object('run_id', p_run_id, 'trigger_type', v_trigger, 'slot_key', v_slot, 'started_at', v_started, 'completed_at', now(), 'summary', COALESCE(p_summary, '{}'::jsonb)));

  v_runtime := (v_runtime - 'active_run_id' - 'active_run_started_at' - 'active_trigger' - 'active_slot_key')
    || jsonb_build_object('last_run', jsonb_build_object('run_id', p_run_id, 'status', v_status, 'trigger_type', v_trigger, 'slot_key', v_slot, 'started_at', v_started, 'completed_at', now(), 'summary', COALESCE(p_summary, '{}'::jsonb)), 'updated_at', now());

  UPDATE public.app_settings SET value_json = v_runtime, updated_at = now()
  WHERE setting_key = 'recipe_automation_runtime';
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.complete_recipe_automation_run_v1(UUID, TEXT, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_recipe_automation_run_v1(UUID, TEXT, JSONB) TO service_role;

-- Generate V2 from the already versioned V1 implementation. This keeps all
-- V1 transactional/idempotency validation and removes only its category allowlist.
DO $$
DECLARE
  v_definition TEXT;
BEGIN
  v_definition := pg_get_functiondef('public.import_recipe_draft_v1(jsonb,uuid,text,text,text)'::regprocedure);
  v_definition := replace(v_definition, 'FUNCTION public.import_recipe_draft_v1(', 'FUNCTION public.import_recipe_draft_v2(');
  v_definition := replace(v_definition, E'    AND slug IN (''aves'', ''carnes'')\n', '');
  EXECUTE v_definition;
END;
$$;

REVOKE ALL ON FUNCTION public.import_recipe_draft_v2(JSONB, UUID, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.import_recipe_draft_v2(JSONB, UUID, TEXT, TEXT, TEXT) TO service_role;

COMMENT ON FUNCTION public.import_recipe_draft_v2(JSONB, UUID, TEXT, TEXT, TEXT) IS
  'Transactional n8n recipe draft import. V2 accepts any active category while preserving V1 validation and idempotency.';
