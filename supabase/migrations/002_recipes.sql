-- ============================================================
-- CARDAPPIO — Migration 002: Recipes (Lote 2)
-- ============================================================
-- Creates: recipe_categories, recipe_tags, recipes,
--          recipe_ingredients, recipe_steps, recipe_tag_links,
--          recipe_variations, favorite_recipes
-- ============================================================

-- 1. recipe_categories
CREATE TABLE recipe_categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT,
  sort_order  INT NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_recipe_categories_slug ON recipe_categories(slug);

CREATE TRIGGER trg_recipe_categories_updated_at
  BEFORE UPDATE ON recipe_categories
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

ALTER TABLE recipe_categories ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read active categories
CREATE POLICY "recipe_categories_select_authenticated"
  ON recipe_categories FOR SELECT
  USING (auth.uid() IS NOT NULL AND is_active = true);

-- Admin can manage categories
CREATE POLICY "recipe_categories_all_admin"
  ON recipe_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'super_admin')
    )
  );

-- 2. recipe_tags
CREATE TABLE recipe_tags (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  tag_type    TEXT NOT NULL DEFAULT 'context'
              CHECK (tag_type IN ('diet', 'difficulty', 'budget', 'context', 'family')),
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_recipe_tags_slug ON recipe_tags(slug);
CREATE INDEX idx_recipe_tags_type ON recipe_tags(tag_type);

ALTER TABLE recipe_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recipe_tags_select_authenticated"
  ON recipe_tags FOR SELECT
  USING (auth.uid() IS NOT NULL AND is_active = true);

CREATE POLICY "recipe_tags_all_admin"
  ON recipe_tags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'super_admin')
    )
  );

-- 3. recipes
CREATE TABLE recipes (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug              TEXT NOT NULL UNIQUE,
  title             TEXT NOT NULL,
  subtitle          TEXT,
  cover_image_url   TEXT,
  difficulty_level  TEXT NOT NULL DEFAULT 'easy'
                    CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
  cost_level        TEXT NOT NULL DEFAULT 'medium'
                    CHECK (cost_level IN ('low', 'medium', 'high')),
  prep_time_minutes INT NOT NULL DEFAULT 30
                    CHECK (prep_time_minutes > 0),
  servings          INT NOT NULL DEFAULT 4
                    CHECK (servings > 0),
  category_id       UUID REFERENCES recipe_categories(id) ON DELETE SET NULL,
  usage_context     TEXT,
  notes             TEXT,
  status            TEXT NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'published', 'archived')),
  is_featured       BOOLEAN NOT NULL DEFAULT false,
  is_premium        BOOLEAN NOT NULL DEFAULT false,
  published_at      TIMESTAMPTZ,
  created_by        UUID REFERENCES profiles(id),
  updated_by        UUID REFERENCES profiles(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_recipes_slug ON recipes(slug);
CREATE INDEX idx_recipes_status ON recipes(status);
CREATE INDEX idx_recipes_category ON recipes(category_id);
CREATE INDEX idx_recipes_difficulty ON recipes(difficulty_level);
CREATE INDEX idx_recipes_cost ON recipes(cost_level);
CREATE INDEX idx_recipes_featured ON recipes(is_featured) WHERE is_featured = true;
CREATE INDEX idx_recipes_title_trgm ON recipes USING GIN (title gin_trgm_ops);

CREATE TRIGGER trg_recipes_updated_at
  BEFORE UPDATE ON recipes
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read published recipes
CREATE POLICY "recipes_select_published"
  ON recipes FOR SELECT
  USING (auth.uid() IS NOT NULL AND status = 'published');

-- Admin can manage all recipes
CREATE POLICY "recipes_all_admin"
  ON recipes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'super_admin')
    )
  );

-- 4. recipe_ingredients
CREATE TABLE recipe_ingredients (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id        UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  quantity_label   TEXT,
  normalized_name  TEXT,
  sort_order       INT NOT NULL DEFAULT 0,
  is_optional      BOOLEAN NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);
CREATE INDEX idx_recipe_ingredients_normalized ON recipe_ingredients(normalized_name);

ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recipe_ingredients_select_authenticated"
  ON recipe_ingredients FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "recipe_ingredients_all_admin"
  ON recipe_ingredients FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'super_admin')
    )
  );

-- 5. recipe_steps
CREATE TABLE recipe_steps (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id    UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  step_number  INT NOT NULL,
  content      TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_recipe_steps_recipe ON recipe_steps(recipe_id);

ALTER TABLE recipe_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recipe_steps_select_authenticated"
  ON recipe_steps FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "recipe_steps_all_admin"
  ON recipe_steps FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'super_admin')
    )
  );

-- 6. recipe_tag_links (join table)
CREATE TABLE recipe_tag_links (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id  UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  tag_id     UUID NOT NULL REFERENCES recipe_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(recipe_id, tag_id)
);

CREATE INDEX idx_recipe_tag_links_recipe ON recipe_tag_links(recipe_id);
CREATE INDEX idx_recipe_tag_links_tag ON recipe_tag_links(tag_id);

ALTER TABLE recipe_tag_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recipe_tag_links_select_authenticated"
  ON recipe_tag_links FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "recipe_tag_links_all_admin"
  ON recipe_tag_links FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'super_admin')
    )
  );

-- 7. recipe_variations
CREATE TABLE recipe_variations (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_recipe_id  UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  variation_title   TEXT NOT NULL,
  variation_notes   TEXT,
  linked_recipe_id  UUID REFERENCES recipes(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_recipe_variations_parent ON recipe_variations(parent_recipe_id);

CREATE TRIGGER trg_recipe_variations_updated_at
  BEFORE UPDATE ON recipe_variations
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

ALTER TABLE recipe_variations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recipe_variations_select_authenticated"
  ON recipe_variations FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "recipe_variations_all_admin"
  ON recipe_variations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'super_admin')
    )
  );

-- 8. favorite_recipes
CREATE TABLE favorite_recipes (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipe_id  UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, recipe_id)
);

CREATE INDEX idx_favorite_recipes_user ON favorite_recipes(user_id);
CREATE INDEX idx_favorite_recipes_recipe ON favorite_recipes(recipe_id);

ALTER TABLE favorite_recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "favorite_recipes_select_own"
  ON favorite_recipes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "favorite_recipes_insert_own"
  ON favorite_recipes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "favorite_recipes_delete_own"
  ON favorite_recipes FOR DELETE
  USING (auth.uid() = user_id);
