-- ============================================================
-- CARDAPPIO — Recipe import automation V1
-- ============================================================
-- Server-side ledger, replay protection and transactional RPC used by the
-- n8n recipe research workflow. No object created here is available to anon
-- or authenticated clients.

CREATE TABLE public.recipe_import_runs (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  correlation_id     UUID NOT NULL UNIQUE,
  source_url          TEXT NOT NULL,
  canonical_url       TEXT NOT NULL,
  content_hash        TEXT NOT NULL,
  recipe_id           UUID REFERENCES public.recipes(id) ON DELETE SET NULL,
  status              TEXT NOT NULL DEFAULT 'processing'
                      CHECK (status IN ('processing', 'succeeded', 'failed')),
  attempt_count       INTEGER NOT NULL DEFAULT 1 CHECK (attempt_count > 0),
  last_error_code     TEXT,
  last_error_message  TEXT,
  payload             JSONB NOT NULL DEFAULT '{}'::jsonb,
  completed_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT recipe_import_runs_source_url_https
    CHECK (source_url ~* '^https://'),
  CONSTRAINT recipe_import_runs_canonical_url_https
    CHECK (canonical_url ~* '^https://'),
  CONSTRAINT recipe_import_runs_content_hash_sha256
    CHECK (content_hash ~ '^[a-f0-9]{64}$'),
  CONSTRAINT recipe_import_runs_error_message_length
    CHECK (last_error_message IS NULL OR length(last_error_message) <= 1000)
);

CREATE INDEX idx_recipe_import_runs_canonical_url
  ON public.recipe_import_runs (canonical_url);

CREATE INDEX idx_recipe_import_runs_content_hash
  ON public.recipe_import_runs (content_hash);

CREATE INDEX idx_recipe_import_runs_status_created
  ON public.recipe_import_runs (status, created_at DESC);

CREATE INDEX idx_recipe_import_runs_recipe
  ON public.recipe_import_runs (recipe_id)
  WHERE recipe_id IS NOT NULL;

CREATE TRIGGER trg_recipe_import_runs_updated_at
  BEFORE UPDATE ON public.recipe_import_runs
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.recipe_import_runs ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.recipe_import_runs FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.recipe_import_runs TO service_role;

COMMENT ON TABLE public.recipe_import_runs IS
  'Internal ledger for n8n recipe research imports. Accessible only to service_role.';

CREATE TABLE public.recipe_import_nonces (
  nonce           TEXT PRIMARY KEY,
  correlation_id  UUID NOT NULL,
  expires_at      TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT recipe_import_nonces_nonce_length
    CHECK (length(nonce) BETWEEN 16 AND 128)
);

CREATE INDEX idx_recipe_import_nonces_expires
  ON public.recipe_import_nonces (expires_at);

ALTER TABLE public.recipe_import_nonces ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.recipe_import_nonces FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, DELETE ON TABLE public.recipe_import_nonces TO service_role;

COMMENT ON TABLE public.recipe_import_nonces IS
  'Short-lived nonces used to reject replayed HMAC requests.';

CREATE OR REPLACE FUNCTION public.claim_recipe_import_nonce_v1(
  p_nonce TEXT,
  p_correlation_id UUID,
  p_expires_at TIMESTAMPTZ
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_inserted INTEGER := 0;
BEGIN
  IF p_nonce IS NULL OR length(p_nonce) NOT BETWEEN 16 AND 128 THEN
    RAISE EXCEPTION 'invalid_nonce' USING ERRCODE = '22023';
  END IF;

  IF p_correlation_id IS NULL THEN
    RAISE EXCEPTION 'invalid_correlation_id' USING ERRCODE = '22023';
  END IF;

  IF p_expires_at IS NULL OR p_expires_at <= now() THEN
    RAISE EXCEPTION 'invalid_nonce_expiration' USING ERRCODE = '22023';
  END IF;

  DELETE FROM public.recipe_import_nonces
  WHERE expires_at < now() - interval '10 minutes';

  INSERT INTO public.recipe_import_nonces (nonce, correlation_id, expires_at)
  VALUES (p_nonce, p_correlation_id, p_expires_at)
  ON CONFLICT (nonce) DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  RETURN v_inserted = 1;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_recipe_import_nonce_v1(TEXT, UUID, TIMESTAMPTZ)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_recipe_import_nonce_v1(TEXT, UUID, TIMESTAMPTZ)
  TO service_role;

CREATE OR REPLACE FUNCTION public.import_recipe_draft_v1(
  p_payload JSONB,
  p_correlation_id UUID,
  p_source_url TEXT,
  p_canonical_url TEXT,
  p_content_hash TEXT
)
RETURNS TABLE (
  result_import_id UUID,
  result_recipe_id UUID,
  result_status TEXT,
  duplicate_reason TEXT
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_run public.recipe_import_runs%ROWTYPE;
  v_existing public.recipe_import_runs%ROWTYPE;
  v_category_id UUID;
  v_recipe_id UUID;
  v_slug_base TEXT;
  v_slug_candidate TEXT;
  v_slug_suffix INTEGER := 1;
  v_invalid_tags TEXT[];
  v_invalid_units TEXT[];
  v_item JSONB;
  v_position BIGINT;
  v_title TEXT;
  v_prep_time INTEGER;
  v_servings INTEGER;
BEGIN
  IF p_payload IS NULL OR jsonb_typeof(p_payload) <> 'object' THEN
    RAISE EXCEPTION 'payload_must_be_object' USING ERRCODE = '22023';
  END IF;

  IF p_correlation_id IS NULL THEN
    RAISE EXCEPTION 'invalid_correlation_id' USING ERRCODE = '22023';
  END IF;

  IF p_source_url IS NULL OR p_source_url !~* '^https://' OR length(p_source_url) > 2048 THEN
    RAISE EXCEPTION 'invalid_source_url' USING ERRCODE = '22023';
  END IF;

  IF p_canonical_url IS NULL OR p_canonical_url !~* '^https://' OR length(p_canonical_url) > 2048 THEN
    RAISE EXCEPTION 'invalid_canonical_url' USING ERRCODE = '22023';
  END IF;

  IF p_content_hash IS NULL OR p_content_hash !~ '^[a-f0-9]{64}$' THEN
    RAISE EXCEPTION 'invalid_content_hash' USING ERRCODE = '22023';
  END IF;

  v_title := btrim(COALESCE(p_payload->>'title', ''));
  IF length(v_title) NOT BETWEEN 3 AND 140 THEN
    RAISE EXCEPTION 'invalid_title' USING ERRCODE = '22023';
  END IF;

  IF jsonb_typeof(p_payload->'ingredients') <> 'array'
     OR jsonb_array_length(p_payload->'ingredients') NOT BETWEEN 2 AND 60 THEN
    RAISE EXCEPTION 'invalid_ingredients' USING ERRCODE = '22023';
  END IF;

  IF jsonb_typeof(p_payload->'steps') <> 'array'
     OR jsonb_array_length(p_payload->'steps') NOT BETWEEN 1 AND 30 THEN
    RAISE EXCEPTION 'invalid_steps' USING ERRCODE = '22023';
  END IF;

  IF jsonb_typeof(COALESCE(p_payload->'tags', '[]'::jsonb)) <> 'array' THEN
    RAISE EXCEPTION 'invalid_tags' USING ERRCODE = '22023';
  END IF;

  BEGIN
    v_prep_time := COALESCE((p_payload->>'prep_time_minutes')::INTEGER, 30);
    v_servings := COALESCE((p_payload->>'servings')::INTEGER, 4);
  EXCEPTION WHEN invalid_text_representation OR numeric_value_out_of_range THEN
    RAISE EXCEPTION 'invalid_numeric_fields' USING ERRCODE = '22023';
  END;

  IF v_prep_time NOT BETWEEN 1 AND 1440 OR v_servings NOT BETWEEN 1 AND 100 THEN
    RAISE EXCEPTION 'numeric_fields_out_of_range' USING ERRCODE = '22023';
  END IF;

  SELECT id INTO v_category_id
  FROM public.recipe_categories
  WHERE slug = p_payload->>'category_slug'
    AND slug IN ('aves', 'carnes')
    AND is_active = true;

  IF v_category_id IS NULL THEN
    RAISE EXCEPTION 'invalid_or_inactive_category' USING ERRCODE = '22023';
  END IF;

  SELECT array_agg(tag_slug ORDER BY tag_slug)
  INTO v_invalid_tags
  FROM (
    SELECT DISTINCT btrim(tag_item->>'slug') AS tag_slug
    FROM jsonb_array_elements(COALESCE(p_payload->'tags', '[]'::jsonb)) AS tag_item
  ) AS requested_tags
  WHERE tag_slug = ''
     OR NOT EXISTS (
       SELECT 1
       FROM public.recipe_tags rt
       WHERE rt.slug = requested_tags.tag_slug
         AND rt.is_active = true
     );

  IF COALESCE(array_length(v_invalid_tags, 1), 0) > 0 THEN
    RAISE EXCEPTION 'invalid_or_inactive_tags:%', array_to_string(v_invalid_tags, ',')
      USING ERRCODE = '22023';
  END IF;

  SELECT array_agg(unit_symbol ORDER BY unit_symbol)
  INTO v_invalid_units
  FROM (
    SELECT DISTINCT NULLIF(btrim(ingredient_item->>'unit'), '') AS unit_symbol
    FROM jsonb_array_elements(p_payload->'ingredients') AS ingredient_item
  ) AS requested_units
  WHERE unit_symbol IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM public.measurement_units mu
      WHERE mu.symbol = requested_units.unit_symbol
        AND mu.is_active = true
    );

  IF COALESCE(array_length(v_invalid_units, 1), 0) > 0 THEN
    RAISE EXCEPTION 'invalid_or_inactive_units:%', array_to_string(v_invalid_units, ',')
      USING ERRCODE = '22023';
  END IF;

  -- Serialize imports that share a source or normalized content. These locks,
  -- combined with the restricted writer role, make the operation idempotent.
  PERFORM pg_advisory_xact_lock(hashtextextended('recipe-import:url:' || p_canonical_url, 0));
  PERFORM pg_advisory_xact_lock(hashtextextended('recipe-import:hash:' || p_content_hash, 0));

  SELECT rir.* INTO v_existing
  FROM public.recipe_import_runs rir
  WHERE rir.status = 'succeeded'
    AND (rir.canonical_url = p_canonical_url OR rir.content_hash = p_content_hash)
  ORDER BY rir.completed_at DESC NULLS LAST, rir.created_at DESC
  LIMIT 1;

  IF v_existing.id IS NOT NULL THEN
    UPDATE public.recipe_import_runs
    SET attempt_count = attempt_count + 1,
        updated_at = now()
    WHERE id = v_existing.id;

    RETURN QUERY SELECT
      v_existing.id,
      v_existing.recipe_id,
      'duplicate'::TEXT,
      CASE
        WHEN v_existing.canonical_url = p_canonical_url THEN 'canonical_url'
        ELSE 'content_hash'
      END::TEXT;
    RETURN;
  END IF;

  SELECT rir.* INTO v_run
  FROM public.recipe_import_runs rir
  WHERE rir.correlation_id = p_correlation_id
  FOR UPDATE;

  IF v_run.id IS NULL THEN
    INSERT INTO public.recipe_import_runs (
      correlation_id,
      source_url,
      canonical_url,
      content_hash,
      status,
      attempt_count,
      payload
    ) VALUES (
      p_correlation_id,
      p_source_url,
      p_canonical_url,
      p_content_hash,
      'processing',
      1,
      p_payload
    )
    RETURNING * INTO v_run;
  ELSE
    UPDATE public.recipe_import_runs
    SET source_url = p_source_url,
        canonical_url = p_canonical_url,
        content_hash = p_content_hash,
        status = 'processing',
        attempt_count = attempt_count + 1,
        last_error_code = NULL,
        last_error_message = NULL,
        payload = p_payload,
        completed_at = NULL,
        updated_at = now()
    WHERE id = v_run.id
    RETURNING * INTO v_run;
  END IF;

  v_slug_base := regexp_replace(lower(COALESCE(NULLIF(p_payload->>'slug', ''), v_title)), '[^a-z0-9]+', '-', 'g');
  v_slug_base := trim(BOTH '-' FROM v_slug_base);
  IF v_slug_base = '' THEN
    v_slug_base := 'receita';
  END IF;
  v_slug_base := left(v_slug_base, 120);

  PERFORM pg_advisory_xact_lock(hashtextextended('recipe-import:slug:' || v_slug_base, 0));

  v_slug_candidate := v_slug_base;
  WHILE EXISTS (SELECT 1 FROM public.recipes r WHERE r.slug = v_slug_candidate) LOOP
    v_slug_suffix := v_slug_suffix + 1;
    v_slug_candidate := left(v_slug_base, 110) || '-' || v_slug_suffix::TEXT;
  END LOOP;

  INSERT INTO public.recipes (
    title,
    subtitle,
    slug,
    cover_image_url,
    difficulty_level,
    cost_level,
    prep_time_minutes,
    servings,
    category_id,
    usage_context,
    notes,
    status,
    is_featured,
    is_premium,
    published_at,
    created_by,
    updated_by
  ) VALUES (
    v_title,
    NULLIF(btrim(p_payload->>'subtitle'), ''),
    v_slug_candidate,
    NULL,
    CASE WHEN p_payload->>'difficulty_level' IN ('easy', 'medium', 'hard')
      THEN p_payload->>'difficulty_level' ELSE 'easy' END,
    CASE WHEN p_payload->>'cost_level' IN ('low', 'medium', 'high')
      THEN p_payload->>'cost_level' ELSE 'medium' END,
    v_prep_time,
    v_servings,
    v_category_id,
    NULLIF(btrim(p_payload->>'usage_context'), ''),
    NULLIF(btrim(p_payload->>'notes'), ''),
    'draft',
    false,
    false,
    NULL,
    NULL,
    NULL
  )
  RETURNING id INTO v_recipe_id;

  FOR v_item, v_position IN
    SELECT ingredient_item, ordinality
    FROM jsonb_array_elements(p_payload->'ingredients') WITH ORDINALITY AS x(ingredient_item, ordinality)
  LOOP
    IF length(btrim(COALESCE(v_item->>'name', ''))) NOT BETWEEN 1 AND 180 THEN
      RAISE EXCEPTION 'invalid_ingredient_name_at:%', v_position USING ERRCODE = '22023';
    END IF;

    INSERT INTO public.recipe_ingredients (
      recipe_id,
      name,
      quantity_label,
      unit,
      normalized_name,
      sort_order,
      is_optional
    ) VALUES (
      v_recipe_id,
      btrim(v_item->>'name'),
      NULLIF(btrim(v_item->>'quantity_label'), ''),
      NULLIF(btrim(v_item->>'unit'), ''),
      lower(COALESCE(NULLIF(btrim(v_item->>'normalized_name'), ''), btrim(v_item->>'name'))),
      v_position::INTEGER,
      COALESCE((v_item->>'is_optional')::BOOLEAN, false)
    );
  END LOOP;

  FOR v_item, v_position IN
    SELECT step_item, ordinality
    FROM jsonb_array_elements(p_payload->'steps') WITH ORDINALITY AS x(step_item, ordinality)
  LOOP
    IF length(btrim(COALESCE(v_item->>'content', ''))) NOT BETWEEN 3 AND 2000 THEN
      RAISE EXCEPTION 'invalid_step_at:%', v_position USING ERRCODE = '22023';
    END IF;

    INSERT INTO public.recipe_steps (recipe_id, step_number, content)
    VALUES (v_recipe_id, v_position::INTEGER, btrim(v_item->>'content'));
  END LOOP;

  INSERT INTO public.recipe_tag_links (recipe_id, tag_id)
  SELECT v_recipe_id, rt.id
  FROM public.recipe_tags rt
  JOIN (
    SELECT DISTINCT btrim(tag_item->>'slug') AS slug
    FROM jsonb_array_elements(COALESCE(p_payload->'tags', '[]'::jsonb)) AS tag_item
  ) requested_tags ON requested_tags.slug = rt.slug
  WHERE rt.is_active = true
  ON CONFLICT (recipe_id, tag_id) DO NOTHING;

  UPDATE public.recipe_import_runs
  SET recipe_id = v_recipe_id,
      status = 'succeeded',
      last_error_code = NULL,
      last_error_message = NULL,
      completed_at = now(),
      updated_at = now()
  WHERE id = v_run.id;

  RETURN QUERY SELECT
    v_run.id,
    v_recipe_id,
    'created'::TEXT,
    NULL::TEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.import_recipe_draft_v1(JSONB, UUID, TEXT, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.import_recipe_draft_v1(JSONB, UUID, TEXT, TEXT, TEXT)
  TO service_role;

CREATE OR REPLACE FUNCTION public.log_recipe_import_failure_v1(
  p_payload JSONB,
  p_correlation_id UUID,
  p_source_url TEXT,
  p_canonical_url TEXT,
  p_content_hash TEXT,
  p_error_code TEXT,
  p_error_message TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_run_id UUID;
BEGIN
  IF p_correlation_id IS NULL
     OR p_source_url IS NULL OR p_source_url !~* '^https://'
     OR p_canonical_url IS NULL OR p_canonical_url !~* '^https://'
     OR p_content_hash IS NULL OR p_content_hash !~ '^[a-f0-9]{64}$' THEN
    RAISE EXCEPTION 'invalid_failure_log_input' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.recipe_import_runs (
    correlation_id,
    source_url,
    canonical_url,
    content_hash,
    status,
    attempt_count,
    last_error_code,
    last_error_message,
    payload,
    completed_at
  ) VALUES (
    p_correlation_id,
    p_source_url,
    p_canonical_url,
    p_content_hash,
    'failed',
    1,
    left(COALESCE(p_error_code, 'unknown_error'), 120),
    left(COALESCE(p_error_message, 'Unknown import error'), 1000),
    COALESCE(p_payload, '{}'::jsonb),
    now()
  )
  ON CONFLICT (correlation_id) DO UPDATE
  SET status = 'failed',
      attempt_count = public.recipe_import_runs.attempt_count + 1,
      last_error_code = EXCLUDED.last_error_code,
      last_error_message = EXCLUDED.last_error_message,
      payload = EXCLUDED.payload,
      completed_at = now(),
      updated_at = now()
  RETURNING id INTO v_run_id;

  RETURN v_run_id;
END;
$$;

REVOKE ALL ON FUNCTION public.log_recipe_import_failure_v1(JSONB, UUID, TEXT, TEXT, TEXT, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_recipe_import_failure_v1(JSONB, UUID, TEXT, TEXT, TEXT, TEXT, TEXT)
  TO service_role;