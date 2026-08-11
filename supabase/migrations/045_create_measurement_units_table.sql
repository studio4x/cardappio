-- ============================================================
-- CARDAPPIO — Migration 045: Create measurement_units table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.measurement_units (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  symbol      TEXT NOT NULL UNIQUE,
  category    TEXT DEFAULT 'Geral',
  sort_order  INT NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_measurement_units_sort ON public.measurement_units(sort_order, name);
CREATE INDEX IF NOT EXISTS idx_measurement_units_active ON public.measurement_units(is_active);

-- Enable RLS
ALTER TABLE public.measurement_units ENABLE ROW LEVEL SECURITY;

-- Allow public and authenticated users to read measurement units
CREATE POLICY "measurement_units_select_policy"
  ON public.measurement_units FOR SELECT
  USING (true);

-- Admin can manage measurement units (ALL)
CREATE POLICY "measurement_units_admin_all_policy"
  ON public.measurement_units FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'super_admin')
    )
  );

-- Seed all 63 initial units from standard system list
INSERT INTO public.measurement_units (symbol, name, category, sort_order) VALUES
  ('a gosto', 'A gosto', 'Geral', 1),
  ('caixa', 'Caixa(s)', 'Recipiente', 2),
  ('centilitro', 'Centilitro (centilitro)', 'Volume', 3),
  ('centilitros', 'Centilitros (centilitros)', 'Volume', 4),
  ('cl', 'Centilitros (cl)', 'Volume', 5),
  ('centímetro', 'Centímetro (centímetro)', 'Medida', 6),
  ('centímetros', 'Centímetros (centímetros)', 'Medida', 7),
  ('cm', 'Centímetro(s) (cm)', 'Medida', 8),
  ('colher (café)', 'Colher (café)', 'Colheres', 9),
  ('colher (chá)', 'Colher (chá)', 'Colheres', 10),
  ('colher (sobremesa)', 'Colher (sobremesa)', 'Colheres', 11),
  ('colher (sopa)', 'Colher (sopa)', 'Colheres', 12),
  ('colher de café', 'Colher(es) de café', 'Colheres', 13),
  ('colher de chá', 'Colher(es) de chá', 'Colheres', 14),
  ('colher de sobremesa', 'Colher(es) de sobremesa', 'Colheres', 15),
  ('colher de sopa', 'Colher(es) de sopa', 'Colheres', 16),
  ('colheres (café)', 'Colheres (café)', 'Colheres', 17),
  ('colheres (chá)', 'Colheres (chá)', 'Colheres', 18),
  ('colheres (sobremesa)', 'Colheres (sobremesa)', 'Colheres', 19),
  ('colheres (sopa)', 'Colheres (sopa)', 'Colheres', 20),
  ('copo', 'Copo(s)', 'Xícaras e Copos', 21),
  ('decilitro', 'Decilitro (decilitro)', 'Volume', 22),
  ('decilitros', 'Decilitros (decilitros)', 'Volume', 23),
  ('dl', 'Decilitros (dl)', 'Volume', 24),
  ('dente', 'Dente(s)', 'Unidade', 25),
  ('dentes', 'Dentes (dentes)', 'Unidade', 26),
  ('fatia', 'Fatia(s)', 'Unidade', 27),
  ('fatias', 'Fatias (fatias)', 'Unidade', 28),
  ('folha', 'Folha(s)', 'Unidade', 29),
  ('folhas', 'Folhas (folhas)', 'Unidade', 30),
  ('grama', 'Grama (grama)', 'Peso', 31),
  ('g', 'Gramas (g)', 'Peso', 32),
  ('gramas', 'Gramas (gramas)', 'Peso', 33),
  ('lata', 'Lata(s)', 'Recipiente', 34),
  ('liter', 'Liter (liter)', 'Volume', 35),
  ('l', 'Litros (l)', 'Volume', 36),
  ('litros', 'Litros (litros)', 'Volume', 37),
  ('maço', 'Maço(s)', 'Unidade', 38),
  ('milligrama', 'Miligrama (milligrama)', 'Peso', 39),
  ('mg', 'Miligramas (mg)', 'Peso', 40),
  ('milligramas', 'Miligramas (milligramas)', 'Peso', 41),
  ('millilitro', 'Mililitro (millilitro)', 'Volume', 42),
  ('millilitros', 'Mililitros (millilitros)', 'Volume', 43),
  ('ml', 'Mililitros (ml)', 'Volume', 44),
  ('milímetro', 'Milímetro (milímetro)', 'Medida', 45),
  ('milímetros', 'Milímetros (milímetros)', 'Medida', 46),
  ('mm', 'Milímetro(s) (mm)', 'Medida', 47),
  ('molho', 'Molho (molho)', 'Unidade', 48),
  ('molhos', 'Molhos (molhos)', 'Unidade', 49),
  ('pacote', 'Pacote(s)', 'Recipiente', 50),
  ('pedaço', 'Pedaço(s)', 'Unidade', 51),
  ('pedaços', 'Pedaços (pedaços)', 'Unidade', 52),
  ('pitada', 'Pitada(s)', 'Geral', 53),
  ('porção', 'Porção (porção)', 'Geral', 54),
  ('quilo', 'Quilo (quilo)', 'Peso', 55),
  ('kg', 'Quilogramas (kg)', 'Peso', 56),
  ('quilos', 'Quilos (quilos)', 'Peso', 57),
  ('ramo', 'Ramo(s)', 'Unidade', 58),
  ('unidade', 'Unidade(s)', 'Unidade', 59),
  ('vidro', 'Vidro(s)', 'Recipiente', 60),
  ('xícara', 'Xícara(s)', 'Xícaras e Copos', 61),
  ('xícaras', 'Xícaras (xícaras)', 'Xícaras e Copos', 62),
  ('xícara de chá', 'Xícara(s) de chá', 'Xícaras e Copos', 63)
ON CONFLICT (symbol) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  sort_order = EXCLUDED.sort_order;
