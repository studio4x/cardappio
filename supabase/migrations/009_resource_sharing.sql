-- ============================================================
-- CARDAPPIO — Migration 009: Resource Sharing (Fase 2)
-- ============================================================
-- Creates: resource_shares
-- Purpose: Temporary shared access to weeks or shopping lists.
-- ============================================================

CREATE TABLE resource_shares (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token           TEXT NOT NULL UNIQUE,
  resource_type   TEXT NOT NULL CHECK (resource_type IN ('week', 'list')),
  resource_id     UUID NOT NULL,
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  expires_at      TIMESTAMPTZ NOT NULL,
  access_count    INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_resource_shares_token ON resource_shares(token);
CREATE INDEX idx_resource_shares_resource ON resource_shares(resource_type, resource_id);
CREATE INDEX idx_resource_shares_expires ON resource_shares(expires_at);

ALTER TABLE resource_shares ENABLE ROW LEVEL SECURITY;

-- Owner can manage their shares
CREATE POLICY "resource_shares_manage_own"
  ON resource_shares FOR ALL
  USING (auth.uid() = user_id);

-- Public can select valid shares
CREATE POLICY "resource_shares_select_public"
  ON resource_shares FOR SELECT
  USING (
    expires_at > now()
  );

-- Permission helpers for shared access (internal)
-- This would be used in RPCs or specific Select policies for resources
-- For now, we keep it simple as a registry for the Edge Function to validate.
