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

-- Seed initial units from current standard list
INSERT INTO public.measurement_units (symbol, name, category, sort_order) VALUES
  ('a gosto', 'A gosto', 'Geral', 1),
  ('colher (sopa)', 'Colher (sopa)', 'Colheres', 2),
  ('colher (chá)', 'Colher (chá)', 'Colheres', 3),
  ('colher (sobremesa)', 'Colher (sobremesa)', 'Colheres', 4),
  ('colher (café)', 'Colher (café)', 'Colheres', 5),
  ('xícara', 'Xícara(s)', 'Xícaras e Copos', 6),
  ('xícara de chá', 'Xícara(s) de chá', 'Xícaras e Copos', 7),
  ('copo', 'Copo(s)', 'Xícaras e Copos', 8),
  ('g', 'Gramas (g)', 'Peso', 9),
  ('kg', 'Quilogramas (kg)', 'Peso', 10),
  ('mg', 'Miligramas (mg)', 'Peso', 11),
  ('ml', 'Mililitros (ml)', 'Volume', 12),
  ('l', 'Litros (l)', 'Volume', 13),
  ('cl', 'Centilitros (cl)', 'Volume', 14),
  ('dl', 'Decilitros (dl)', 'Volume', 15),
  ('unidade', 'Unidade(s)', 'Unidade', 16),
  ('pitada', 'Pitada(s)', 'Geral', 17),
  ('dente', 'Dente(s)', 'Unidade', 18),
  ('fatia', 'Fatia(s)', 'Unidade', 19),
  ('folha', 'Folha(s)', 'Unidade', 20),
  ('lata', 'Lata(s)', 'Recipiente', 21),
  ('caixa', 'Caixa(s)', 'Recipiente', 22),
  ('pacote', 'Pacote(s)', 'Recipiente', 23),
  ('vidro', 'Vidro(s)', 'Recipiente', 24),
  ('maço', 'Maço(s)', 'Unidade', 25),
  ('ramo', 'Ramo(s)', 'Unidade', 26),
  ('pedaço', 'Pedaço(s)', 'Unidade', 27),
  ('porção', 'Porção (porção)', 'Geral', 28),
  ('cm', 'Centímetro(s) (cm)', 'Medida', 29),
  ('mm', 'Milímetro(s) (mm)', 'Medida', 30)
ON CONFLICT (symbol) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  sort_order = EXCLUDED.sort_order;
