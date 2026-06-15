-- ============================================================
-- CARDAPPIO — Migration 038: Schedule Notification Dispatch Cron
-- ============================================================

-- 1. Enable pg_cron and pg_net extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Create the dispatch function that handles both local development (Kong) and production environment URLs
CREATE OR REPLACE FUNCTION public.dispatch_notifications_cron()
RETURNS void AS $$
BEGIN
  -- Invoke local kong edge function (useful for local development environment)
  PERFORM net.http_post(
    url := 'http://kong:8000/functions/v1/dispatch-notifications',
    headers := '{"Content-Type": "application/json"}'::jsonb
  );

  -- Invoke production edge function (using production Supabase project domain)
  PERFORM net.http_post(
    url := 'https://wkngjvsgafmdwejmckks.supabase.co/functions/v1/dispatch-notifications',
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Schedule the cron job to run every 5 minutes
-- Safe unschedule first to prevent duplicate/colliding jobs on migration re-runs
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname = 'dispatch-notifications-every-5-minutes';

SELECT cron.schedule(
  'dispatch-notifications-every-5-minutes',
  '*/5 * * * *',
  'SELECT public.dispatch_notifications_cron();'
);
