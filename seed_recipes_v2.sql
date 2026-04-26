-- Categorias
INSERT INTO recipe_categories (id, name, slug, description, sort_order, is_active)
VALUES 
  ('c1000000-0000-0000-0000-000000000001', 'Pratos Principais', 'pratos-principais', 'Receitas para o dia a dia', 1, true),
  ('c1000000-0000-0000-0000-000000000002', 'Massas', 'massas', 'Macarrão, lasanhas e risotos', 2, true),
  ('c1000000-0000-0000-0000-000000000003', 'Carnes e Aves', 'carnes-aves', 'Proteínas bovinas e frangos', 3, true),
  ('c1000000-0000-0000-0000-000000000004', 'Saladas e Saudáveis', 'saladas-saudaveis', 'Dietas leves e fitness', 4, true),
  ('c1000000-0000-0000-0000-000000000005', 'Sobremesas', 'sobremesas', 'Doces e encerramentos', 5, true)
ON CONFLICT (id) DO NOTHING;

-- Coleções
INSERT INTO recipe_collections (id, title, slug, description, cover_image_url, is_active, is_premium, sort_order)
VALUES 
  ('c0000000-0000-0000-0000-000000000001', 'Jantares Rápidos 30 Min', 'jantares-rapidos', 'Receitas expressas para dias corridos de trabalho.', 'https://images.unsplash.com/photo-1548825838-51842bc4cf20?auto=format&fit=crop&q=80&w=1200', true, false, 1),
  ('c0000000-0000-0000-0000-000000000002', 'Especial Fim de Semana', 'fim-de-semana', 'Almoços em família memoráveis.', 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&q=80&w=1200', true, true, 2),
  ('c0000000-0000-0000-0000-000000000003', 'Saúde e Fitness', 'saude-fitness', 'Baixo carbo, altas proteínas.', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=1200', true, false, 3)
ON CONFLICT (id) DO NOTHING;

-- Receitas (20 itens com imagens reais Unsplash)
INSERT INTO recipes (id, slug, title, subtitle, cover_image_url, difficulty_level, cost_level, prep_time_minutes, servings, category_id, usage_context, status, is_featured, is_premium, published_at, created_by)
VALUES 
  ('eecc0000-0000-0000-0000-000000000001', 'lasanha-bolonhesa', 'Lasanha à Bolonhesa Clássica', 'Com molho bechamel artesanal', 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?auto=format&fit=crop&q=80&w=800', 'medium', 'medium', 90, 6, 'c1000000-0000-0000-0000-000000000002', 'Almoço de domingo', 'published', true, false, now(), 'b5059897-cab2-4464-a13a-4618492fecd0'),
  ('eecc0000-0000-0000-0000-000000000002', 'frango-assado-batatas', 'Frango Assado com Batatas', 'Temperado com ervas finas', 'https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?auto=format&fit=crop&q=80&w=800', 'easy', 'low', 60, 4, 'c1000000-0000-0000-0000-000000000003', 'Jantar em família', 'published', true, false, now(), 'b5059897-cab2-4464-a13a-4618492fecd0'),
  ('eecc0000-0000-0000-0000-000000000003', 'strogonoff-carne', 'Strogonoff de Carne Tradicional', 'O favorito dos brasileiros', 'https://images.unsplash.com/photo-1551061986-e8eebf814b6c?auto=format&fit=crop&q=80&w=800', 'easy', 'medium', 40, 4, 'c1000000-0000-0000-0000-000000000001', 'Almoço rápido', 'published', false, false, now(), 'b5059897-cab2-4464-a13a-4618492fecd0'),
  ('eecc0000-0000-0000-0000-000000000004', 'salada-caprese', 'Salada Caprese', 'Frescor da Itália no prato', 'https://images.unsplash.com/photo-1529312266912-b33cfce2eefd?auto=format&fit=crop&q=80&w=800', 'easy', 'high', 15, 2, 'c1000000-0000-0000-0000-000000000004', 'Entrada elegante', 'published', false, true, now(), 'b5059897-cab2-4464-a13a-4618492fecd0'),
  ('eecc0000-0000-0000-0000-000000000005', 'brownie-chocolate', 'Brownie de Chocolate Molhadinho', 'Com casquinha crocante', 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&q=80&w=800', 'medium', 'low', 45, 8, 'c1000000-0000-0000-0000-000000000005', 'Sobremesa infalível', 'published', true, false, now(), 'b5059897-cab2-4464-a13a-4618492fecd0'),
  ('eecc0000-0000-0000-0000-000000000006', 'risoto-funghi', 'Risoto de Funghi Secchi', 'Cremoso e sofisticado', 'https://images.unsplash.com/photo-1633504581786-316c8002b1b9?auto=format&fit=crop&q=80&w=800', 'hard', 'high', 50, 4, 'c1000000-0000-0000-0000-000000000002', 'Jantar romântico', 'published', true, true, now(), 'b5059897-cab2-4464-a13a-4618492fecd0'),
  ('eecc0000-0000-0000-0000-000000000007', 'salmao-grelhado', 'Salmão Grelhado com Aspargos', 'Rápido, fit e delicioso', 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&q=80&w=800', 'easy', 'high', 20, 2, 'c1000000-0000-0000-0000-000000000003', 'Dieta de proteína', 'published', false, true, now(), 'b5059897-cab2-4464-a13a-4618492fecd0'),
  ('eecc0000-0000-0000-0000-000000000008', 'macarrao-alho-oleo', 'Macarrão Alho e Óleo', 'Express com pimenta calabresa', 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&q=80&w=800', 'easy', 'low', 15, 2, 'c1000000-0000-0000-0000-000000000002', 'Madrugada ou correria', 'published', false, false, now(), 'b5059897-cab2-4464-a13a-4618492fecd0'),
  ('eecc0000-0000-0000-0000-000000000009', 'bife-acebolado', 'Bife Acebolado Suculento', 'Clássico dia a dia', 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&q=80&w=800', 'easy', 'medium', 20, 4, 'c1000000-0000-0000-0000-000000000003', 'Almoço trivial', 'published', false, false, now(), 'b5059897-cab2-4464-a13a-4618492fecd0'),
  ('eecc0000-0000-0000-0000-000000000010', 'salada-quinoa', 'Salada de Quinoa Mediterrânea', 'Nutritiva e refrescante', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=800', 'easy', 'medium', 25, 3, 'c1000000-0000-0000-0000-000000000004', 'Marmita saudável', 'published', false, false, now(), 'b5059897-cab2-4464-a13a-4618492fecd0'),
  ('eecc0000-0000-0000-0000-000000000011', 'pudim-leite-condensado', 'Pudim de Leite Condensado', 'Sem furinhos na massa', 'https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?auto=format&fit=crop&q=80&w=800', 'medium', 'medium', 90, 8, 'c1000000-0000-0000-0000-000000000005', 'Sobremesa de domingo', 'published', false, false, now(), 'b5059897-cab2-4464-a13a-4618492fecd0'),
  ('eecc0000-0000-0000-0000-000000000012', 'hamburguer-artesanal', 'Hambúrguer Caseiro Artesanal', 'Pão brioche e blend especial', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800', 'medium', 'medium', 30, 4, 'c1000000-0000-0000-0000-000000000003', 'Noite de lanches', 'published', true, false, now(), 'b5059897-cab2-4464-a13a-4618492fecd0'),
  ('eecc0000-0000-0000-0000-000000000013', 'espaguete-carbonara', 'Espaguete à Carbonara', 'Receita original italiana', 'https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&q=80&w=800', 'medium', 'high', 25, 2, 'c1000000-0000-0000-0000-000000000002', 'Jantar especial', 'published', false, true, now(), 'b5059897-cab2-4464-a13a-4618492fecd0'),
  ('eecc0000-0000-0000-0000-000000000014', 'crepioca-frango', 'Crepioca de Frango Fit', 'Pós-treino fácil', 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&q=80&w=800', 'easy', 'low', 10, 1, 'c1000000-0000-0000-0000-000000000004', 'Café / Pós-Treino', 'published', false, false, now(), 'b5059897-cab2-4464-a13a-4618492fecd0'),
  ('eecc0000-0000-0000-0000-000000000015', 'moqueca-peixe', 'Moqueca Baiana de Peixe', 'Com azeite de dendê e leite de coco', 'https://images.unsplash.com/photo-1548822558-7e3f6d7ab7ce?auto=format&fit=crop&q=80&w=800', 'hard', 'high', 60, 6, 'c1000000-0000-0000-0000-000000000001', 'Almoço festivo', 'published', true, true, now(), 'b5059897-cab2-4464-a13a-4618492fecd0'),
  ('eecc0000-0000-0000-0000-000000000016', 'arroz-forno', 'Arroz de Forno Cremoso', 'Aproveitamento de sobras maravilhoso', 'https://images.unsplash.com/photo-1593444452140-5a5078d46db1?auto=format&fit=crop&q=80&w=800', 'easy', 'low', 30, 4, 'c1000000-0000-0000-0000-000000000001', 'Almoço dia a dia', 'published', false, false, now(), 'b5059897-cab2-4464-a13a-4618492fecd0'),
  ('eecc0000-0000-0000-0000-000000000017', 'torta-limao', 'Torta de Limão com Merengue', 'Equilíbrio doce e azedo', 'https://images.unsplash.com/photo-1519869325930-281384150729?auto=format&fit=crop&q=80&w=800', 'medium', 'medium', 70, 8, 'c1000000-0000-0000-0000-000000000005', 'Aniversário ou Domingo', 'published', true, true, now(), 'b5059897-cab2-4464-a13a-4618492fecd0'),
  ('eecc0000-0000-0000-0000-000000000018', 'omelete-recheado', 'Omelete de Queijo e Tomate', 'Básico que salva a janta', 'https://images.unsplash.com/photo-1510693060596-f90bbaa8501e?auto=format&fit=crop&q=80&w=800', 'easy', 'low', 10, 1, 'c1000000-0000-0000-0000-000000000004', 'Jantar Express', 'published', false, false, now(), 'b5059897-cab2-4464-a13a-4618492fecd0'),
  ('eecc0000-0000-0000-0000-000000000019', 'picadinho-carne', 'Picadinho com Ovo e Farofa', 'Bem caseiro', 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=800', 'easy', 'medium', 35, 4, 'c1000000-0000-0000-0000-000000000003', 'Marmita da Semana', 'published', false, false, now(), 'b5059897-cab2-4464-a13a-4618492fecd0'),
  ('eecc0000-0000-0000-0000-000000000020', 'nhoque-abobora', 'Nhoque de Abóbora na Manteiga', 'Com folhas de sálvia', 'https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?auto=format&fit=crop&q=80&w=800', 'medium', 'high', 80, 4, 'c1000000-0000-0000-0000-000000000002', 'Jantar de Inverno', 'published', false, true, now(), 'b5059897-cab2-4464-a13a-4618492fecd0')
ON CONFLICT (id) DO NOTHING;

-- Vínculo Coleções e Receitas
INSERT INTO recipe_collection_items (id, collection_id, recipe_id, sort_order)
VALUES
  ('11ee0001-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000001', 'eecc0000-0000-0000-0000-000000000008', 1),
  ('11ee0002-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000001', 'eecc0000-0000-0000-0000-000000000018', 2),
  ('11ee0003-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000001', 'eecc0000-0000-0000-0000-000000000007', 3),

  ('11ee0004-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000002', 'eecc0000-0000-0000-0000-000000000001', 1),
  ('11ee0005-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000002', 'eecc0000-0000-0000-0000-000000000015', 2),
  ('11ee0006-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000002', 'eecc0000-0000-0000-0000-000000000002', 3),
  ('11ee0007-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000002', 'eecc0000-0000-0000-0000-000000000011', 4),

  ('11ee0008-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000003', 'eecc0000-0000-0000-0000-000000000007', 1),
  ('11ee0009-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000003', 'eecc0000-0000-0000-0000-000000000010', 2),
  ('11ee0010-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000003', 'eecc0000-0000-0000-0000-000000000014', 3)
ON CONFLICT (id) DO NOTHING;
