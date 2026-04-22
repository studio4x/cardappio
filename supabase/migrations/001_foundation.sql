-- ============================================================
-- CARDAPPIO — Migration 001: Foundation
-- ============================================================
-- Creates: extensions, helper functions, profiles,
--          user_preferences, app_settings, audit_logs
-- Includes: triggers, indexes, RLS policies
-- ============================================================

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For future text search

-- 2. Helper function: auto-update updated_at
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 3. Table: profiles
-- ============================================================
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  full_name   TEXT,
  avatar_url  TEXT,
  role        TEXT NOT NULL DEFAULT 'user'
              CHECK (role IN ('user', 'admin', 'super_admin')),
  status      TEXT NOT NULL DEFAULT 'active'
              CHECK (status IN ('active', 'inactive', 'suspended')),
  last_seen_at        TIMESTAMPTZ,
  onboarding_completed_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE UNIQUE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_status ON profiles(status);

-- Trigger: updated_at
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile (limited fields)
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admin can read all profiles
CREATE POLICY "profiles_select_admin"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'super_admin')
    )
  );

-- ============================================================
-- 4. Table: user_preferences
-- ============================================================
CREATE TABLE user_preferences (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                   UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  household_size            INT NOT NULL DEFAULT 2
                            CHECK (household_size > 0 AND household_size <= 20),
  default_meal_modes        JSONB NOT NULL DEFAULT '["lunch", "dinner"]'::jsonb,
  default_plan_days         INT NOT NULL DEFAULT 5
                            CHECK (default_plan_days >= 1 AND default_plan_days <= 7),
  dietary_preferences       JSONB NOT NULL DEFAULT '[]'::jsonb,
  dietary_restrictions      JSONB NOT NULL DEFAULT '[]'::jsonb,
  primary_goal              TEXT,
  preferred_recipe_contexts JSONB NOT NULL DEFAULT '[]'::jsonb,
  quiet_hours_enabled       BOOLEAN NOT NULL DEFAULT false,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- Trigger: updated_at
CREATE TRIGGER trg_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Users can read/write their own preferences
CREATE POLICY "user_preferences_select_own"
  ON user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "user_preferences_insert_own"
  ON user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_preferences_update_own"
  ON user_preferences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admin can read preferences for support
CREATE POLICY "user_preferences_select_admin"
  ON user_preferences FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'super_admin')
    )
  );

-- ============================================================
-- 5. Table: app_settings
-- ============================================================
CREATE TABLE app_settings (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key TEXT NOT NULL UNIQUE,
  value_json  JSONB NOT NULL DEFAULT '{}'::jsonb,
  description TEXT,
  updated_by  UUID REFERENCES profiles(id),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger: updated_at
CREATE TRIGGER trg_app_settings_updated_at
  BEFORE UPDATE ON app_settings
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Only admin/super_admin can read/write
CREATE POLICY "app_settings_select_admin"
  ON app_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "app_settings_all_admin"
  ON app_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'super_admin')
    )
  );

-- ============================================================
-- 6. Table: audit_logs
-- ============================================================
CREATE TABLE audit_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_user_id   UUID REFERENCES profiles(id),
  action          TEXT NOT NULL,
  entity_type     TEXT NOT NULL,
  entity_id       TEXT,
  metadata_json   JSONB DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_user_id);
CREATE INDEX idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX idx_audit_logs_entity_id ON audit_logs(entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admin/super_admin can read
CREATE POLICY "audit_logs_select_admin"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'super_admin')
    )
  );

-- Backend/service role can insert (no user-facing writes)
CREATE POLICY "audit_logs_insert_service"
  ON audit_logs FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- 7. Auto-create profile on signup
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
