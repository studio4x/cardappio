-- ============================================================
-- CARDAPPIO — Migration 026: AI Config Seed in app_settings
-- ============================================================
-- Creates the 'ai_config' setting_key in app_settings.
-- Keys are stored encrypted at-rest by Supabase and only readable
-- by admin roles via RLS. They are consumed exclusively by the
-- generate-nutrition Edge Function using the service_role.

INSERT INTO public.app_settings (setting_key, value_json, description)
VALUES (
  'ai_config',
  '{
    "openai_api_key": "",
    "gemini_api_key": "",
    "preferred_provider": "openai"
  }'::jsonb,
  'Credenciais e configuração dos provedores de IA para geração de tabela nutricional'
)
ON CONFLICT (setting_key) DO NOTHING;
