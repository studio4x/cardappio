-- ============================================================
-- CARDAPPIO — Migration 040: PWA Vercel Webhook Trigger
-- ============================================================

-- 1. Insert default vercel_config row in app_settings if not exists
INSERT INTO public.app_settings (setting_key, value_json, description)
VALUES (
  'vercel_config',
  '{"deploy_webhook_url": ""}'::jsonb,
  'Configurações de integração com a Vercel para auto-deploy'
)
ON CONFLICT (setting_key) DO NOTHING;

-- 2. Create the trigger function to invoke the Vercel webhook via pg_net
CREATE OR REPLACE FUNCTION public.trigger_vercel_deploy()
RETURNS trigger AS $$
DECLARE
  vercel_url text;
  new_logo_dark text;
  new_logo_light text;
  new_favicon text;
  old_logo_dark text;
  old_logo_light text;
  old_favicon text;
  should_trigger boolean := false;
BEGIN
  IF (NEW.setting_key = 'visual_identity') THEN
    new_logo_dark := NEW.value_json->>'logo_dark_url';
    new_logo_light := NEW.value_json->>'logo_light_url';
    new_favicon := NEW.value_json->>'favicon_url';
    
    old_logo_dark := OLD.value_json->>'logo_dark_url';
    old_logo_light := OLD.value_json->>'logo_light_url';
    old_favicon := OLD.value_json->>'favicon_url';

    -- Trigger only if a new non-empty image URL is added/changed
    IF (
      (new_logo_dark IS DISTINCT FROM old_logo_dark AND new_logo_dark IS NOT NULL AND new_logo_dark <> '') OR
      (new_logo_light IS DISTINCT FROM old_logo_light AND new_logo_light IS NOT NULL AND new_logo_light <> '') OR
      (new_favicon IS DISTINCT FROM old_favicon AND new_favicon IS NOT NULL AND new_favicon <> '')
    ) THEN
      should_trigger := true;
    END IF;

    IF should_trigger THEN
      -- Fetch the configured Vercel Deploy Webhook URL
      SELECT value_json->>'deploy_webhook_url' INTO vercel_url
      FROM public.app_settings
      WHERE setting_key = 'vercel_config';
      
      IF vercel_url IS NOT NULL AND vercel_url <> '' THEN
        -- Invoke the webhook asynchronously using pg_net
        PERFORM net.http_post(
          url := vercel_url,
          headers := jsonb_build_object('Content-Type', 'application/json'),
          body := '{}'::jsonb
        );
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Associate the trigger with the app_settings table
DROP TRIGGER IF EXISTS trg_vercel_deploy_on_settings_update ON public.app_settings;

CREATE TRIGGER trg_vercel_deploy_on_settings_update
AFTER UPDATE ON public.app_settings
FOR EACH ROW
EXECUTE FUNCTION public.trigger_vercel_deploy();
