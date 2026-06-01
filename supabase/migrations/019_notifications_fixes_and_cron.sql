-- ============================================================
-- CARDAPPIO — Migration 019: Notifications Fixes & Cron Logs
-- ============================================================
-- Creates: cron_execution_logs table
-- ============================================================

CREATE TABLE IF NOT EXISTS cron_execution_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_name        TEXT NOT NULL,
  status          TEXT NOT NULL,
  processed_count INT DEFAULT 0,
  metadata_json   JSONB DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cron_logs_job_name ON cron_execution_logs(job_name);
CREATE INDEX IF NOT EXISTS idx_cron_logs_created_at ON cron_execution_logs(created_at DESC);

-- Enable RLS and restrict access to admin only
ALTER TABLE cron_execution_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cron_logs_select_admin"
  ON cron_execution_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "cron_logs_insert_service"
  ON cron_execution_logs FOR INSERT
  WITH CHECK (true); -- Service role / backend triggers can insert logs
