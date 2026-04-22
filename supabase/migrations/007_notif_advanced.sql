-- ============================================================
-- CARDAPPIO — Migration 007: Advanced Notifications (Lote 6 cont.)
-- ============================================================
-- Creates: notification_queue, notification_delivery_logs,
--          notification_preferences
-- ============================================================

-- 1. notification_preferences
CREATE TABLE notification_preferences (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  meal_reminders      BOOLEAN NOT NULL DEFAULT true,
  daily_summary       BOOLEAN NOT NULL DEFAULT false,
  marketing_alerts    BOOLEAN NOT NULL DEFAULT true,
  system_updates      BOOLEAN NOT NULL DEFAULT true,
  push_enabled        BOOLEAN NOT NULL DEFAULT false,
  push_token          TEXT,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notif_pref_user ON notification_preferences(user_id);

CREATE TRIGGER trg_notif_pref_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notif_pref_select_own"
  ON notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "notif_pref_all_own"
  ON notification_preferences FOR ALL
  USING (auth.uid() = user_id);

-- 2. notification_queue (For async processing)
CREATE TABLE notification_queue (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  body            TEXT NOT NULL,
  type            TEXT NOT NULL,
  payload_json    JSONB DEFAULT '{}'::jsonb,
  scheduled_for   TIMESTAMPTZ NOT NULL DEFAULT now(),
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed')),
  attempts        INT NOT NULL DEFAULT 0,
  last_error      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notif_queue_status_date ON notification_queue(status, scheduled_for);

ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;

-- Only service role/admin can manage queue
CREATE POLICY "notif_queue_all_admin"
  ON notification_queue FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'super_admin')
    )
  );

-- 3. notification_delivery_logs
CREATE TABLE notification_delivery_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notification_id UUID REFERENCES notifications(id) ON DELETE SET NULL,
  user_id         UUID REFERENCES profiles(id) ON DELETE CASCADE,
  channel         TEXT NOT NULL CHECK (channel IN ('in_app', 'push', 'email', 'sms')),
  status          TEXT NOT NULL,
  error_message   TEXT,
  metadata        JSONB DEFAULT '{}'::jsonb,
  delivered_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notif_logs_user ON notification_delivery_logs(user_id);
CREATE INDEX idx_notif_logs_delivered ON notification_delivery_logs(delivered_at DESC);

ALTER TABLE notification_delivery_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notif_logs_select_admin"
  ON notification_delivery_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'super_admin')
    )
  );
