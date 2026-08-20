-- ============================================================
-- CARDAPPIO — Migration 051: Blog Custom Main Carousel
-- ============================================================

-- 1. Ensure blog_carousel setting key is readable by public
DROP POLICY IF EXISTS "app_settings_select_public" ON public.app_settings;

CREATE POLICY "app_settings_select_public"
ON public.app_settings FOR SELECT
USING (
  setting_key IN ('visual_identity', 'public_config', 'blog_layout', 'blog_carousel')
);

-- 2. Seed initial blog_carousel configuration
INSERT INTO public.app_settings (setting_key, value_json, description)
VALUES (
  'blog_carousel',
  '{
    "slides": []
  }'::jsonb,
  'Configurações de carrossel em destaque da página do blog público'
)
ON CONFLICT (setting_key) DO NOTHING;
