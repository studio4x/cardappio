-- Allow public to read specific setting keys (like visual identity)
CREATE POLICY "app_settings_select_public"
ON public.app_settings FOR SELECT
USING (
  setting_key IN ('visual_identity', 'public_config')
);
