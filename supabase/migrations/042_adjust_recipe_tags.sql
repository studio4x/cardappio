-- ============================================================
-- CARDAPPIO — Migration 042: Adjust Recipe Tags
-- ============================================================

-- 1. Inserir as novas tags
INSERT INTO recipe_tags (id, name, slug, tag_type, is_active)
VALUES 
  ('e2000000-0000-0000-0000-000000000001', 'Arroz', 'arroz', 'context', true),
  ('e2000000-0000-0000-0000-000000000002', 'Caldo', 'caldo', 'context', true),
  ('e2000000-0000-0000-0000-000000000003', 'Carne bovina', 'carne-bovina', 'context', true),
  ('e2000000-0000-0000-0000-000000000004', 'Carne suína', 'carne-suina', 'context', true),
  ('e2000000-0000-0000-0000-000000000005', 'Cereal', 'cereal', 'context', true),
  ('e2000000-0000-0000-0000-000000000006', 'Cereais', 'cereais', 'context', true),
  ('e2000000-0000-0000-0000-000000000007', 'Dieta', 'dieta', 'diet', true),
  ('e2000000-0000-0000-0000-000000000008', 'Entradas frias', 'entradas-frias', 'context', true),
  ('e2000000-0000-0000-0000-000000000009', 'Entradas quentes', 'entradas-quentes', 'context', true),
  ('e2000000-0000-0000-0000-000000000010', 'Frango', 'frango', 'context', true),
  ('e2000000-0000-0000-0000-000000000011', 'Galeto', 'galeto', 'context', true),
  ('e2000000-0000-0000-0000-000000000012', 'Linguiça', 'linguica', 'context', true),
  ('e2000000-0000-0000-0000-000000000013', 'Macarrão', 'macarrao', 'context', true),
  ('e2000000-0000-0000-0000-000000000014', 'Molho', 'molho', 'context', true),
  ('e2000000-0000-0000-0000-000000000015', 'Ovo', 'ovo', 'context', true),
  ('e2000000-0000-0000-0000-000000000016', 'Quiches', 'quiches', 'context', true),
  ('e2000000-0000-0000-0000-000000000017', 'Risoto', 'risoto', 'context', true),
  ('e2000000-0000-0000-0000-000000000018', 'Salada', 'salada', 'context', true),
  ('e2000000-0000-0000-0000-000000000019', 'Salsicha', 'salsicha', 'context', true),
  ('e2000000-0000-0000-0000-000000000020', 'Sopa', 'sopa', 'context', true),
  ('e2000000-0000-0000-0000-000000000021', 'Sopa creme', 'sopa-creme', 'context', true),
  ('e2000000-0000-0000-0000-000000000022', 'Tortas frias', 'tortas-frias', 'context', true),
  ('e2000000-0000-0000-0000-000000000023', 'Tortas quentes', 'tortas-quentes', 'context', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  tag_type = EXCLUDED.tag_type;

-- 2. Remover do banco qualquer tag sobressalente
DELETE FROM recipe_tags 
WHERE slug NOT IN (
  'arroz', 'caldo', 'carne-bovina', 'carne-suina', 'cereal', 'cereais', 'dieta',
  'entradas-frias', 'entradas-quentes', 'frango', 'galeto', 'linguica', 'macarrao',
  'molho', 'ovo', 'quiches', 'risoto', 'salada', 'salsicha', 'sopa', 'sopa-creme',
  'tortas-frias', 'tortas-quentes'
);
