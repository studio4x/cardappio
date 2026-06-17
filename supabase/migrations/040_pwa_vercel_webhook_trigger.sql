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
BEGIN
  -- Only trigger if the visual_identity settings have changed
  IF (NEW.setting_key = 'visual_identity' AND NEW.value_json IS DISTINCT FROM OLD.value_json) THEN
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
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Associate the trigger with the app_settings table
DROP TRIGGER IF EXISTS trg_vercel_deploy_on_settings_update ON public.app_settings;

CREATE TRIGGER trg_vercel_deploy_on_settings_update
AFTER UPDATE ON public.app_settings
FOR EACH ROW
EXECUTE FUNCTION public.trigger_vercel_deploy();
