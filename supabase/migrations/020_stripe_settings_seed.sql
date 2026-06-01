-- ============================================================
-- CARDAPPIO — Migration 020: Stripe Dynamic Config Seed
-- ============================================================
-- Inserts: Default values for stripe_config in app_settings
-- ============================================================

INSERT INTO public.app_settings (setting_key, value_json, description)
VALUES (
  'stripe_config',
  '{
    "mode": "sandbox",
    "sandbox_publishable_key": "",
    "sandbox_secret_key": "",
    "sandbox_webhook_secret": "",
    "production_publishable_key": "",
    "production_secret_key": "",
    "production_webhook_secret": ""
  }'::jsonb,
  'Configurações de integração dinâmica com o Stripe (chaves e webhook)'
)
ON CONFLICT (setting_key) DO NOTHING;
