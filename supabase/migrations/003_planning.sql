-- ============================================================
-- CARDAPPIO — Migration 003: Planning (Lote 3)
-- ============================================================
-- Creates: meal_plan_weeks, meal_plan_days, meal_plan_slots,
--          shopping_lists, shopping_list_items
-- ============================================================

-- 1. meal_plan_weeks
CREATE TABLE meal_plan_weeks (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title           TEXT,
  week_start_date DATE NOT NULL,
  week_end_date   DATE NOT NULL,
  status          TEXT NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft', 'active', 'archived')),
  is_template     BOOLEAN NOT NULL DEFAULT false,
  source_week_id  UUID REFERENCES meal_plan_weeks(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_meal_plan_weeks_user ON meal_plan_weeks(user_id);
CREATE INDEX idx_meal_plan_weeks_status ON meal_plan_weeks(status);
CREATE INDEX idx_meal_plan_weeks_start_date ON meal_plan_weeks(week_start_date DESC);
CREATE INDEX idx_meal_plan_weeks_user_active ON meal_plan_weeks(user_id, status)
  WHERE status = 'active';

CREATE TRIGGER trg_meal_plan_weeks_updated_at
  BEFORE UPDATE ON meal_plan_weeks
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

ALTER TABLE meal_plan_weeks ENABLE ROW LEVEL SECURITY;

-- User can manage their own weeks
CREATE POLICY "meal_plan_weeks_select_own"
  ON meal_plan_weeks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "meal_plan_weeks_insert_own"
  ON meal_plan_weeks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "meal_plan_weeks_update_own"
  ON meal_plan_weeks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "meal_plan_weeks_delete_own"
  ON meal_plan_weeks FOR DELETE
  USING (auth.uid() = user_id);

-- 2. meal_plan_days
CREATE TABLE meal_plan_days (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  week_id        UUID NOT NULL REFERENCES meal_plan_weeks(id) ON DELETE CASCADE,
  day_of_week    TEXT NOT NULL
                 CHECK (day_of_week IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')),
  date_reference DATE,
  sort_order     INT NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_meal_plan_days_week ON meal_plan_days(week_id);

ALTER TABLE meal_plan_days ENABLE ROW LEVEL SECURITY;

-- Owner of the week can manage days
CREATE POLICY "meal_plan_days_select_own"
  ON meal_plan_days FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM meal_plan_weeks w
      WHERE w.id = week_id AND w.user_id = auth.uid()
    )
  );

CREATE POLICY "meal_plan_days_insert_own"
  ON meal_plan_days FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM meal_plan_weeks w
      WHERE w.id = week_id AND w.user_id = auth.uid()
    )
  );

CREATE POLICY "meal_plan_days_update_own"
  ON meal_plan_days FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM meal_plan_weeks w
      WHERE w.id = week_id AND w.user_id = auth.uid()
    )
  );

CREATE POLICY "meal_plan_days_delete_own"
  ON meal_plan_days FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM meal_plan_weeks w
      WHERE w.id = week_id AND w.user_id = auth.uid()
    )
  );

-- 3. meal_plan_slots
CREATE TABLE meal_plan_slots (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  day_id      UUID NOT NULL REFERENCES meal_plan_days(id) ON DELETE CASCADE,
  meal_type   TEXT NOT NULL
              CHECK (meal_type IN ('lunch', 'dinner')),
  recipe_id   UUID REFERENCES recipes(id) ON DELETE SET NULL,
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_meal_plan_slots_day ON meal_plan_slots(day_id);
CREATE INDEX idx_meal_plan_slots_recipe ON meal_plan_slots(recipe_id);

CREATE TRIGGER trg_meal_plan_slots_updated_at
  BEFORE UPDATE ON meal_plan_slots
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

ALTER TABLE meal_plan_slots ENABLE ROW LEVEL SECURITY;

-- Owner of the week (via day) can manage slots
CREATE POLICY "meal_plan_slots_select_own"
  ON meal_plan_slots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM meal_plan_days d
      JOIN meal_plan_weeks w ON w.id = d.week_id
      WHERE d.id = day_id AND w.user_id = auth.uid()
    )
  );

CREATE POLICY "meal_plan_slots_insert_own"
  ON meal_plan_slots FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM meal_plan_days d
      JOIN meal_plan_weeks w ON w.id = d.week_id
      WHERE d.id = day_id AND w.user_id = auth.uid()
    )
  );

CREATE POLICY "meal_plan_slots_update_own"
  ON meal_plan_slots FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM meal_plan_days d
      JOIN meal_plan_weeks w ON w.id = d.week_id
      WHERE d.id = day_id AND w.user_id = auth.uid()
    )
  );

CREATE POLICY "meal_plan_slots_delete_own"
  ON meal_plan_slots FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM meal_plan_days d
      JOIN meal_plan_weeks w ON w.id = d.week_id
      WHERE d.id = day_id AND w.user_id = auth.uid()
    )
  );

-- 4. shopping_lists
CREATE TABLE shopping_lists (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  week_id       UUID NOT NULL REFERENCES meal_plan_weeks(id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'active'
                CHECK (status IN ('active', 'archived')),
  generated_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_shopping_lists_user ON shopping_lists(user_id);
CREATE INDEX idx_shopping_lists_week ON shopping_lists(week_id);
CREATE UNIQUE INDEX idx_shopping_lists_user_week ON shopping_lists(user_id, week_id);

CREATE TRIGGER trg_shopping_lists_updated_at
  BEFORE UPDATE ON shopping_lists
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shopping_lists_select_own"
  ON shopping_lists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "shopping_lists_insert_own"
  ON shopping_lists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "shopping_lists_update_own"
  ON shopping_lists FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "shopping_lists_delete_own"
  ON shopping_lists FOR DELETE
  USING (auth.uid() = user_id);

-- 5. shopping_list_items
CREATE TABLE shopping_list_items (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shopping_list_id  UUID NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
  ingredient_label  TEXT NOT NULL,
  normalized_name   TEXT,
  quantity_label    TEXT,
  source_recipe_count INT NOT NULL DEFAULT 1,
  is_checked        BOOLEAN NOT NULL DEFAULT false,
  sort_order        INT NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_shopping_list_items_list ON shopping_list_items(shopping_list_id);
CREATE INDEX idx_shopping_list_items_checked ON shopping_list_items(is_checked);

CREATE TRIGGER trg_shopping_list_items_updated_at
  BEFORE UPDATE ON shopping_list_items
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

ALTER TABLE shopping_list_items ENABLE ROW LEVEL SECURITY;

-- Owner of the list can manage items
CREATE POLICY "shopping_list_items_select_own"
  ON shopping_list_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shopping_lists sl
      WHERE sl.id = shopping_list_id AND sl.user_id = auth.uid()
    )
  );

CREATE POLICY "shopping_list_items_insert_own"
  ON shopping_list_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shopping_lists sl
      WHERE sl.id = shopping_list_id AND sl.user_id = auth.uid()
    )
  );

CREATE POLICY "shopping_list_items_update_own"
  ON shopping_list_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM shopping_lists sl
      WHERE sl.id = shopping_list_id AND sl.user_id = auth.uid()
    )
  );

CREATE POLICY "shopping_list_items_delete_own"
  ON shopping_list_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM shopping_lists sl
      WHERE sl.id = shopping_list_id AND sl.user_id = auth.uid()
    )
  );
