-- ============================================================
-- CARDAPPIO — Migration 036: Brevo API Provider Support
-- ============================================================
-- Adds `provider` column to email_logs for tracking which
-- provider sent each email (smtp | brevo).
-- Updates email_config seed to include brevo_api_key field.
-- ============================================================

-- 1. Add provider column to email_logs
ALTER TABLE public.email_logs
  ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'smtp'
  CHECK (provider IN ('smtp', 'brevo'));

-- 2. Index for filtering logs by provider
CREATE INDEX IF NOT EXISTS idx_email_logs_provider
  ON public.email_logs(provider);

-- 3. Update email_config in app_settings to include brevo fields
-- (only if the row exists; preserves existing smtp credentials)
UPDATE public.app_settings
SET value_json = value_json || jsonb_build_object(
  'provider',       COALESCE((value_json->>'provider'), 'smtp'),
  'brevo_api_key',  COALESCE((value_json->>'brevo_api_key'), '')
)
WHERE setting_key = 'email_config';

-- 4. Insert email_config row if it doesn't exist yet (idempotent seed)
INSERT INTO public.app_settings (setting_key, value_json)
VALUES (
  'email_config',
  jsonb_build_object(
    'provider',      'smtp',
    'brevo_api_key', '',
    'smtp_host',     'smtp-relay.brevo.com',
    'smtp_port',     587,
    'smtp_user',     '',
    'smtp_pass',     '',
    'from_email',    'contato@studio4x.com.br',
    'from_name',     'Cardappio'
  )
)
ON CONFLICT (setting_key) DO NOTHING;
