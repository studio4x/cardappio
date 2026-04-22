-- ============================================================
-- CARDAPPIO — Migration 005: Subscriptions (Lote 5)
-- ============================================================
-- Creates: subscription_plans, user_subscriptions
-- Includes: RLS policies, indexed searches
-- ============================================================

-- 1. subscription_plans
CREATE TABLE subscription_plans (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  description     TEXT,
  price_monthly   DECIMAL(10,2) NOT NULL,
  price_yearly    DECIMAL(10,2) NOT NULL,
  trial_days      INT NOT NULL DEFAULT 0,
  features        JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  stripe_price_id_monthly TEXT,
  stripe_price_id_yearly  TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscription_plans_select_active"
  ON subscription_plans FOR SELECT
  USING (is_active = true);

-- 2. user_subscriptions
CREATE TABLE user_subscriptions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  plan_id             UUID NOT NULL REFERENCES subscription_plans(id),
  status              TEXT NOT NULL CHECK (status IN ('active', 'past_due', 'canceled', 'trialing', 'incomplete')),
  tier                TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'premium', 'gold')),
  billing_cycle       TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly', 'lifetime')),
  current_period_end  TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  stripe_customer_id  TEXT,
  stripe_subscription_id TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_subscriptions_user ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);

CREATE TRIGGER trg_user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_subscriptions_select_own"
  ON user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Admin management
CREATE POLICY "subscription_plans_all_admin"
  ON subscription_plans FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "user_subscriptions_select_admin"
  ON user_subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'super_admin')
    )
  );
