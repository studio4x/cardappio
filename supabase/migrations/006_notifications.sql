-- ============================================================
-- CARDAPPIO — Migration 006: Notifications (Lote 6)
-- ============================================================
-- Creates: notifications
-- Includes: RLS, indexes for fast unread count
-- ============================================================

CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  body            TEXT NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('meal_reminder', 'system', 'promotion', 'subscription')),
  action_url      TEXT,
  is_read         BOOLEAN NOT NULL DEFAULT false,
  read_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_unread ON notifications(user_id) WHERE is_read = false;
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_own"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "notifications_update_own"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notifications_insert_system"
  ON notifications FOR INSERT
  WITH CHECK (true); -- Backend triggers/services will insert
