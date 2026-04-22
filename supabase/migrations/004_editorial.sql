-- ============================================================
-- CARDAPPIO — Migration 004: Editorial Content (Lote 4)
-- ============================================================
-- Creates: recipe_collections, recipe_collection_items,
--          editorial_notices
-- ============================================================

-- 1. recipe_collections
CREATE TABLE recipe_collections (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title             TEXT NOT NULL,
  slug              TEXT NOT NULL UNIQUE,
  description       TEXT,
  cover_image_url   TEXT,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  is_premium        BOOLEAN NOT NULL DEFAULT false,
  sort_order        INT NOT NULL DEFAULT 0,
  starts_at         TIMESTAMPTZ,
  ends_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_recipe_collections_slug ON recipe_collections(slug);
CREATE INDEX idx_recipe_collections_active ON recipe_collections(is_active);
CREATE INDEX idx_recipe_collections_premium ON recipe_collections(is_premium);

CREATE TRIGGER trg_recipe_collections_updated_at
  BEFORE UPDATE ON recipe_collections
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

ALTER TABLE recipe_collections ENABLE ROW LEVEL SECURITY;

-- Reading active collections (premium check handled in app logic or separate policy)
CREATE POLICY "recipe_collections_select_active"
  ON recipe_collections FOR SELECT
  USING (is_active = true);

-- Admin can manage
CREATE POLICY "recipe_collections_all_admin"
  ON recipe_collections FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'super_admin')
    )
  );

-- 2. recipe_collection_items (relational table)
CREATE TABLE recipe_collection_items (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_id  UUID NOT NULL REFERENCES recipe_collections(id) ON DELETE CASCADE,
  recipe_id      UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  sort_order     INT NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(collection_id, recipe_id)
);

CREATE INDEX idx_recipe_collection_items_coll ON recipe_collection_items(collection_id);
CREATE INDEX idx_recipe_collection_items_recipe ON recipe_collection_items(recipe_id);

ALTER TABLE recipe_collection_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recipe_collection_items_select"
  ON recipe_collection_items FOR SELECT
  USING (true);

CREATE POLICY "recipe_collection_items_all_admin"
  ON recipe_collection_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'super_admin')
    )
  );

-- 3. editorial_notices (Tips, Alerts, Seasonal content)
CREATE TABLE editorial_notices (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title           TEXT NOT NULL,
  body            TEXT NOT NULL,
  notice_type     TEXT NOT NULL CHECK (notice_type IN ('tip', 'alert', 'seasonal', 'premium')),
  target_audience TEXT NOT NULL DEFAULT 'all' CHECK (target_audience IN ('all', 'free', 'premium')),
  is_active       BOOLEAN NOT NULL DEFAULT true,
  starts_at       TIMESTAMPTZ,
  ends_at         TIMESTAMPTZ,
  created_by      UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_editorial_notices_active ON editorial_notices(is_active);
CREATE INDEX idx_editorial_notices_type ON editorial_notices(notice_type);

CREATE TRIGGER trg_editorial_notices_updated_at
  BEFORE UPDATE ON editorial_notices
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

ALTER TABLE editorial_notices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "editorial_notices_select_active"
  ON editorial_notices FOR SELECT
  USING (
    is_active = true 
    AND (starts_at IS NULL OR starts_at <= now())
    AND (ends_at IS NULL OR ends_at >= now())
  );

CREATE POLICY "editorial_notices_all_admin"
  ON editorial_notices FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'super_admin')
    )
  );
