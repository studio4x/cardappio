-- ============================================================
-- CARDAPPIO — Migration 013: Setup Admin Settings & Storage
-- ============================================================

-- 1. Create storage bucket for system assets if not exists
-- Note: This assumes the storage schema and buckets table exist (standard in Supabase)
INSERT INTO storage.buckets (id, name, public)
VALUES ('system', 'system', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage Policies for 'system' bucket
-- Allow public read access
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'system' );

-- Allow admins to upload/update/delete
CREATE POLICY "Admin CRUD Access"
ON storage.objects FOR ALL
USING (
  bucket_id = 'system' AND
  (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  ))
)
WITH CHECK (
  bucket_id = 'system' AND
  (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  ))
);

-- 3. Ensure 'visual_identity' setting exists
INSERT INTO public.app_settings (setting_key, value_json, description)
VALUES (
  'visual_identity',
  '{
    "logo_dark_url": "",
    "logo_light_url": "",
    "favicon_url": ""
  }'::jsonb,
  'Configurações de identidade visual do site (logotipos e favicon)'
)
ON CONFLICT (setting_key) DO NOTHING;
