-- ============================================================
-- CARDAPPIO — Migration 008: Security Audit & Structural Fixes
-- ============================================================
-- 1. Standardizes Admin/Super Admin access across all tables
-- 2. Adds missing subscription_events and webhook_events tables
-- 3. Refines recipe visibility based on premium tiers
-- ============================================================

-- 1. Helper Function: Is User Premium?
CREATE OR REPLACE FUNCTION is_premium_user(target_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_subscriptions
    WHERE user_id = target_user_id
    AND status IN ('active', 'trialing')
    AND tier IN ('premium', 'gold')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Table: subscription_events (Missing from Lot 5)
CREATE TABLE subscription_events (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_type      TEXT NOT NULL,
  provider_id     TEXT, -- Stripe event id
  payload         JSONB DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sub_events_user ON subscription_events(user_id);
CREATE INDEX idx_sub_events_created ON subscription_events(created_at DESC);

ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sub_events_select_own"
  ON subscription_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "sub_events_select_admin"
  ON subscription_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'super_admin')
    )
  );

-- 3. Table: processed_webhook_events (Idempotency)
CREATE TABLE processed_webhook_events (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider        TEXT NOT NULL,
  provider_event_id TEXT NOT NULL UNIQUE,
  processed_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE processed_webhook_events ENABLE ROW LEVEL SECURITY;

-- Only admin/service role
CREATE POLICY "processed_webhooks_admin"
  ON processed_webhook_events FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'super_admin')
    )
  );

-- 4. Refine Recipe RLS (Access Control)
DROP POLICY IF EXISTS "recipes_select_published" ON recipes;

CREATE POLICY "recipes_select_access"
  ON recipes FOR SELECT
  USING (
    (auth.uid() IS NOT NULL AND status = 'published' AND (is_premium = false OR is_premium_user(auth.uid())))
    OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'super_admin')
    )
  );

-- 5. Standardize Admin Access for Audit Logs
DROP POLICY IF EXISTS "audit_logs_select_admin" ON audit_logs;
CREATE POLICY "audit_logs_admin_all"
  ON audit_logs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'super_admin')
    )
  );

-- 6. Ensure recipe_categories/tags management for Super Admin
DROP POLICY IF EXISTS "recipe_categories_all_admin" ON recipe_categories;
CREATE POLICY "recipe_categories_manage"
  ON recipe_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "recipe_tags_all_admin" ON recipe_tags;
CREATE POLICY "recipe_tags_manage"
  ON recipe_tags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'super_admin')
    )
  );
