-- ============================================================
-- CARDAPPIO — Migration 021: Email Settings Seed
-- ============================================================

INSERT INTO public.app_settings (setting_key, value_json, description)
VALUES (
  'email_config',
  '{
    "provider": "resend",
    "resend_api_key": "",
    "from_email": "Cardappio <onboarding@resend.dev>"
  }'::jsonb,
  'Configurações de envio de e-mails da plataforma (provedor e chaves)'
)
ON CONFLICT (setting_key) DO NOTHING;
